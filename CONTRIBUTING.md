# Ably Features Action: Contributing

## Release Process

1. Bump the version number in `package.json`
2. Run `npm install` which will update the version in `package-lock.json` and also reveal whether there are any dependency vulnerabilities to be fixed
3. Run `npm run package` to compile the JS into a single file (output will be in the [`dist` folder](dist/))
4. Commit the changes to the dist folder from step 3, alongside the version change from steps 1 and 2
5. Update [`CHANGELOG.md`](CHANGELOG.md)
6. Commit the change to the Changelog from step 5
7. Push a tag with the absolute new version number to GitHub, which must be in the form `v<major>.<minor>.<patch>` - e.g. `v1.3.0`
8. Move the tag for the `major` version number to the same commit, which will be in the form `v<major>` - e.g. `v1`

Commits made in steps 1 thru 6 should ideally be pushed to a release branch, seeking approval from others to land to `main` (default) branch prior to adding and moving tags.

## See Also

- [Ably SDK Team: Guidance on Releases](https://github.com/ably/engineering/blob/main/sdk/releases.md)
- [GitHub Actions: Creating actions: About custom actions: Using tags for release management](https://docs.github.com/en/actions/creating-actions/about-custom-actions#using-tags-for-release-management)
