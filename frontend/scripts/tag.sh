cd /Users/toni.tassani/code/humblyproud-multiproject/learning-studio

npm version patch --workspace=frontend --no-git-tag-version
VERSION=$(node -p "require('./frontend/package.json').version")

git add frontend/package.json package-lock.json
git commit -m "v$VERSION"
git tag -a "v$VERSION" -m "Release v$VERSION"
git push origin HEAD --tags

## From project root (DOES NOT WORK)
## This will update package.json version, create a git tag, and push the tag to the remote repository.
## major | minor | patch
npm version patch --workspace=frontend


git tag -a v1.4.X -m "Release v1.4.X"
git push --tags