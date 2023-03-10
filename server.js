const core = require('@actions/core');
const https = require('node:https');
const { build, ManifestObjects } = require('@ably/features-core/html-matrix-build');

const outputPath = 'output';

// Entry Point
(async () => {
  try {
    await render();
    inform();
  } catch (error) {
    console.error(error);
    process.exit(2);
  }
})();

async function render() {
  const repositoryName = process.env.GITHUB_REPOSITORY.split('/')[1];
  const sdkRepositoryNamePrefix = 'ably-';
  const sdkName = repositoryName.startsWith(sdkRepositoryNamePrefix)
    ? repositoryName.substring(sdkRepositoryNamePrefix.length)
    : repositoryName; // fallback when run in a repository where the name doesn't have our standard prefix

  const sdkManifestObjects = new ManifestObjects(
    [sdkName],
    new Map([[sdkName, '.ably/capabilities.yaml']]),
  );

  const { commonVersion } = sdkManifestObjects;
  console.log(`Canonical Feature List Version: "${commonVersion}" (manifest count: ${sdkManifestObjects.objects.size})`);

  const featuresSource = await fetch(`https://github.com/ably/features/raw/v${commonVersion}/sdk.yaml`);

  const subTitle = `${sdkName} SDK Features`;

  build(
    featuresSource,
    sdkManifestObjects,
    outputPath,
    subTitle,
  );
}

function inform() {
  const emit = (key, value) => {
    core.info(`${key}: ${value}`);
    core.setOutput(key, value);
  };

  emit('matrix-path', outputPath);
  emit('matrix-artifact-name', 'features');
}

/**
 * Simple Web-Fetch-alike function to HTTP GET a resource.
 * API based upon: https://developer.mozilla.org/en-US/docs/Web/API/fetch
 * We need this because Node.js 16 (the maximum version supported by GitHub Actions) doesn't have Fetch.
 */
async function fetch(url) {
  return new Promise((resolve, reject) => {
    const fetchOrFollowRedirect = (location, depth) => {
      if (depth > 3) {
        throw new Error('Exceeded arbitrary redirect follow limit.');
      }

      https.get(location, (response) => {
        const { statusCode } = response;
        const contentType = response.headers['content-type'];

        console.log(`Fetch: ${statusCode} status code from ${location}`);

        if (statusCode === 302) {
          fetchOrFollowRedirect(response.headers.location, depth + 1);
          return;
        }

        let error;
        if (statusCode !== 200) {
          error = new Error(`Request failed with status code ${statusCode}.`);
        } else if (!/^text\/plain/.test(contentType)) {
          error = new Error(`Unexpected content-type. Expected 'text/plain' but received '${contentType}'.`);
        }

        if (error) {
          response.resume(); // Consume response data to free up memory
          reject(error);
          return;
        }

        response.setEncoding('utf8');
        let bodyData = '';
        response.on('data', (chunk) => { bodyData += chunk; });
        response.on('end', () => {
          resolve(bodyData);
        });
      });
    };

    fetchOrFollowRedirect(url, 0);
  });
}
