---
title: "Repairing a corrupted Time Machine volume over SMB"
date: 2026-08-08
---

# Repairing a corrupted Time Machine volume over SMB

These are notes about Time Machine backups to a NAS over SMB suddenly failing,
and what I did to try to fix it. **Attempting to fix it took far longer than it
should have because one file in the backup image was flagged `uchg` (immutable),
which blocked every attempt to open the volume for repair.** The real damage was
corruption in the APFS filesystem inside the sparsebundle; there was an "invalid
object map" that `fsck_apfs` could not repair.

The only initial error I received was the Time Machine service on my Mac saying,
"Backup failed". An interrupted backup apparently set that flag. When an attach
dies without detaching cleanly, it appears to stay on. Because `uchg` overrides
ownership, `sudo` did not help, and every read-write attach failed with a
permissions error that had nothing to do with permissions.

## Symptoms and diagnosis

The full set of errors this produced, in case you're searching for one of them:

- `Backup failed: BACKUP_VERIFICATION_FAILED_PREVIOUSLY (501)`
- `Backup failed: BACKUP_FAILED_DISK_IMAGE_NOT_MOUNTED (21)`
- `hdiutil: attach failed - Permission denied`
- `Failed to attach ... using mode 'read/write' ... Couldn't open token' with flags 0x2102`
- `Failed to mount destination.` from `tmutil latestbackup`
- Disk Utility's First Aid doing nothing at all when you open the sparsebundle.
  There's no response or UI feedback.

The failure was primarily through trying to attach the sparsebundle image.
Attaching by hand:

```bash
sudo hdiutil attach -nomount -noverify -nobrowse -readwrite /Volumes/YourShare/*.sparsebundle
```

produced nothing but:

```text
hdiutil: attach failed - Permission denied
```

Time Machine itself mounted the SMB share without trouble, then failed at the
next step, where it opens the sparsebundle as a disk image. `backupd` logged the
exact file it could not open:

```text
Failed to attach to '.../YourMac.sparsebundle' using mode 'read/write',
error: ... Code=150 ... Couldn't open token' with flags 0x2102,
UID:GID(Name)=0:wheel mode=0x81c0 (our euid is 0)
Backup failed: BACKUP_FAILED_DISK_IMAGE_NOT_MOUNTED (21)
```

The telling part is `our euid is 0`: it ran as root and still could not open the
file.

To check whether Time Machine can even reach the destination:

```bash
tmutil destinationinfo
tmutil latestbackup
```

Then read the real errors. (In zsh, `log` is a shell builtin, so `log show ...`
fails with `too many arguments`. Use the full path.):

```bash
/usr/bin/log show --last 24h --style compact --predicate 'subsystem == "com.apple.TimeMachine"' | grep -iE "error|fail|fsck"
```

And check the failure count, which is where I first saw something was properly
wrong:

```bash
defaults read /Library/Preferences/com.apple.TimeMachine.plist | grep -A20 Destinations
```

A long list of `AttemptDates` with a `RESULT = 501` means it's been retrying
hourly and failing instantly every time.

## What worked when fixing

### 1. Find the immutable flag

This is what blocked my initial repair attempts. First mount the share that
holds the sparsebundle. The easiest way is Finder: **Go → Connect to Server**
(⌘K), enter `smb://you@nas.local/YourShare`, and it mounts at
`/Volumes/YourShare`.

From the command line, create the mount point (this needs `sudo`, since
`/Volumes` is root-owned) and then mount it **as yourself**:

```bash
sudo mkdir -p /Volumes/YourShare
mount_smbfs //you@nas.local/YourShare /Volumes/YourShare
```

Add `-N` to reuse a password already saved in your keychain instead of being
prompted. Don't run the `mount_smbfs` itself under `sudo`: a root-mounted share
shows up as `d--x--x--x root wheel`, so an unprivileged shell cannot expand a
glob inside it and you get confusing `no matches found` errors from the commands
below.

With the share mounted:

```bash
ls -lO /Volumes/YourShare/*.sparsebundle/token
ls -ldO /Volumes/YourShare/*.sparsebundle
```

If you see `uchg` in the flags column, that's your problem:

```text
-rwx------  1 you  staff  uchg  1092  token
```

### 2. Clear `uchg`

```bash
sudo chflags nouchg /Volumes/YourShare/*.sparsebundle/token /Volumes/YourShare/*.sparsebundle
```

If your shell expands the glob before `sudo` runs and finds nothing (common when
the share is mounted by root), wrap it:

```bash
sudo zsh -c 'chflags nouchg /Volumes/YourShare/*.sparsebundle/token /Volumes/YourShare/*.sparsebundle'
```

### 3. Attach read-write and run a real repair

Now the attach that failed should work:

```bash
sudo zsh -c 'hdiutil attach -nomount -noverify -nobrowse -readwrite /Volumes/YourShare/*.sparsebundle'
```

**Be patient.** Mine took **14 minutes** on a 745 GB encrypted bundle (written
on an HDD) before it printed anything. Killing the attach may re-set the `uchg`
flag. If you want to confirm it's alive rather than stuck, watch the helper
accumulate CPU:

```bash
ps -o pid,stat,etime,%cpu,time,command -p $(pgrep -d, -f diskimages-helper)
```

Then repair the volume, using the APFS device from the attach output:

```bash
sudo fsck_apfs -y /dev/rdisk5s1
```

### 4. Detach cleanly

```bash
sudo hdiutil detach /dev/disk5
```

**No `-force`.** A forced detach skips the cleanup that clears `uchg`.

## What didn't work

These procedures didn't work:

- **Disk Utility → First Aid.** Opening the sparsebundle appeared to do
  _nothing_ — no error, no sidebar entry. It was silently hitting the same
  read-write refusal.
- **`diskutil repairVolume`.** It shelled out to `fsck_apfs` and inherited the
  identical failure.
- **`sudo` / running as root.** `uchg` overrides ownership, so root buys you
  nothing. This misled me longest: the permissions looked perfect, I was root,
  and it still said `Permission denied`.
- **Granting Full Disk Access.** My terminal already had this permission.
- **Mounting the share as root rather than as my user.** It made no difference
  to the attach failure itself. It does change whether the commands above work,
  though. A root-mounted share blocks glob expansion from an unprivileged shell.
- **Waiting for Time Machine to fix itself.** It won't. I believe that macOS
  runs `fsck_apfs` in _check-only_ mode, so it answers `NO` to every "Fix this?"
  prompt, declares the volume unrepairable, and gives up. Only a manual
  `fsck_apfs -y` actually attempts repairs.

## My conclusion: irrepairable corruption

The flag fix got me a working read-write attach, but the repair still failed.
`fsck_apfs -y` finally answered `YES` and fixed a checksum, then hit damage it
couldn't reconstruct:

```text
error: btn: invalid btn_val_free_list entry (576, 6914)
   Object map is invalid.
** The volume ... was found to be corrupt and cannot be repaired.
```

I had to delete the Time Machine backup and start again. I at least had
confidence that a real repair couldn't fix whatever had happened.

## My Time Machine, Samba and Ansible setup

The destination is a Linux VM (on Proxmox) running Samba with the `vfs_fruit`
module, all configured by Ansible. The Samba config is rendered from this
template. The YAML wrapper is specific to the container image I run Samba in
(`docker.io/crazymax/samba`, pinned to an exact version rather than `latest`),
but every string under `global:` and `share:` is a literal `smb.conf` setting,
so it translates directly to a stock Samba install:

```text
auth:
  - user: "{{ smb_username }}"
    group: "{{ smb_username }}"
    uid: 1000
    gid: 1000
    password: "{{ smb_password }}"

global:
  - "workgroup = WORKGROUP"
  - "server string = NAS"
  - "server role = standalone server"
  - "log level = 2"
  # Fruit global options for macOS compatibility
  - "vfs objects = fruit streams_xattr"
  - "fruit:metadata = stream"
  - "fruit:model = MacSamba"
  - "fruit:posix_rename = yes"
  - "fruit:veto_appledouble = no"
  - "fruit:nfs_aces = no"
  - "fruit:wipe_intentionally_left_blank_rfork = yes"
  - "fruit:delete_empty_adfiles = yes"
  - "fruit:aapl = yes"
  - "netbios aliases = {{ samba_netbios_aliases }}"
  - "host msdfs = no"

share:
  - name: "{{ samba_share_tm }}"
    path: "{{ storage_mount }}/{{ samba_share_tm }}"
    browsable: yes
    readonly: no
    guestok: no
    validusers: "{{ smb_username }}"
    writelist: "{{ smb_username }}"
    fruit:
      - "time machine = yes"
      - "time machine max size = 1T"
```

Three things there matter for Time Machine. `vfs objects = fruit streams_xattr`
plus `fruit:aapl = yes` enables the macOS SMB extensions. `time machine = yes`
on the share is what makes it offer itself as a backup destination at all. And
`time machine max size` caps the sparsebundle so backups can't grow into the
rest of the volume.

The share directory itself is created by Ansible, owned by the same account
Samba authenticates, with mode `0770`. The backing filesystem is plain ext4; the
sparsebundle is just a directory of band files sitting on it.

Everything is pushed by one idempotent playbook, which I can re-run at any time
to bring the host back to the declared state. The tasks that matter, trimmed:

```text
- name: Ensure ext4 filesystem on storage disk
  community.general.filesystem:
    fstype: ext4
    dev: "{{ storage_disk_dev }}"

- name: Mount storage disk
  ansible.posix.mount:
    path: "{{ storage_mount }}"
    src: "{{ storage_disk_dev }}"
    fstype: ext4
    state: mounted
    opts: "defaults,nofail,x-systemd.device-timeout=30"

- name: Create share directories
  ansible.builtin.file:
    path: "{{ storage_mount }}/{{ item }}"
    state: directory
    mode: "0770"
    owner: "{{ ansible_user }}"
    group: "{{ ansible_user }}"
  loop:
    - "{{ samba_share_tm }}"

- name: Generate Samba configuration
  ansible.builtin.template:
    src: samba-config.yml.j2
    dest: /root/samba-config.yml
    mode: "0644"
  register: samba_config

- name: Deploy Samba container
  containers.podman.podman_container:
    name: samba
    image: docker.io/crazymax/samba
    state: quadlet
    restart_policy: always
    network:
      - host
    volume:
      - "{{ storage_mount }}:{{ storage_mount }}"
      - "/root/samba-config.yml:/data/config.yml"
    healthcheck: "smbclient -L \\\\localhost -U % -m SMB3"
    healthcheck_interval: 30s
    healthcheck_failure_action: kill
  register: samba_quadlet
```

More details:

- **The disk is referenced by its `/dev/disk/by-id/...` path, never
  `/dev/sdX`.** Kernel device letters are assigned in enumeration order and are
  not stable across reboots. A kernel update once swapped the storage and OS
  disks, after which the `filesystem` task above tried to `mkfs` the live root
  disk. Only `mke2fs` refusing to touch a mounted device saved it.
- **`nofail` and `x-systemd.device-timeout`.** Without them, a missing or slow
  disk fails `local-fs.target` at boot and drops a root-locked VM into emergency
  mode, which presents as an unreachable host rather than a mount problem.
- **`register:` on both the config template and the container.** The result of
  each feeds a later task that restarts the Samba unit only when one of them
  actually changed, so re-running the playbook doesn't interrupt a backup in
  progress.
- **`healthcheck_failure_action: kill`.** An unhealthy Podman container exits
  and systemd restarts it, rather than Podman restarting it itself. One owner of
  the service lifecycle is much easier to reason about when something is wrong.
