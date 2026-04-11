# mdbrown.dev

Home page for <https://github.com/m-d-brown>.

## Architecture & Deployment

This site has been modernized to use **GitHub Actions** for deployment instead of the legacy GitHub Pages builder. This allows for:
- **Ruby 4.0+ Compatibility**: Local development on newer Ruby versions (like Ruby 4.0.2).
- **Custom Gems**: Use of standard Jekyll gems and plugins without the restrictions of the `github-pages` meta-gem.

### Deployment Process

The site is automatically built and deployed via the workflow in [pages.yml](.github/workflows/pages.yml). 

> [!IMPORTANT]
> To enable this, the repository settings must be configured:
> **Settings** -> **Pages** -> **Build and deployment** -> **Source** -> Change to **"GitHub Actions"**.

### Local Development

To test the site locally:

1. **Ruby Version**: This project is compatible with Ruby 4.0.2+. 
2. **Standard Gems**: The `Gemfile` uses the standard `jekyll` gem. Note that some gems like `logger`, `base64`, and `bigdecimal` are explicitly included to maintain compatibility with Ruby 4.0's removed standard libraries.

#### Commands

1. Install dependencies:
   ```bash
   export PATH="/opt/homebrew/opt/ruby/bin:$PATH" # If using Homebrew Ruby
   bundle install
   ```

2. Run the Jekyll server:
   ```bash
   bundle exec jekyll serve --port 4001
   ```

The site will be available at `http://127.0.0.1:4001/`.

## Github Guidance

https://docs.github.com/en/pages/setting-up-a-github-pages-site-with-jekyll/about-github-pages-and-jekyll

