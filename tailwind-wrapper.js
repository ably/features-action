const tailwind = require('tailwindcss');
require('tailwindcss/plugin'); // for configJs, defined later on
const autoprefixer = require('autoprefixer');
const postcss = require('postcss');
const fs = require('fs');

// const inputCss = require.resolve('./main.css');
// const inputCss = require('./main.css');

const inputCss = `
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  h1 {
    @apply text-2xl font-bold;
  }
  ul {
    @apply list-disc pl-5 mb-2;
  }
  p {
    @apply mb-2;
  }
  code {
    @apply text-slate-600 bg-amber-100;
  }
  a code {
    @apply bg-inherit hover:text-amber-700 hover:font-semibold;
  }
  a {
    @apply hover:underline hover:text-amber-700;
  }
  .tooltip-contents {
    @apply invisible rounded-md shadow-lg py-1 px-2 bg-gray-200 border-2 border-amber-500 absolute -mt-9 -ml-2;
  }
  .tooltip-container {
    @apply cursor-default;
  }
  .tooltip-container:hover .tooltip-contents {
    @apply visible z-50;
  }
  .tooltip-container:hover {
    @apply bg-amber-100;
  }

  /*
   * btn styles taken from:
   * https://v1.tailwindcss.com/components/buttons#simple
   * Adding inline-block here for a element.
   */
  a.btn {
    @apply inline-block;
  }
  .btn {
    @apply font-bold py-1 px-2 rounded;
  }
  .btn-blue {
    @apply bg-blue-500 text-white;
  }
  .btn-blue:hover {
    @apply bg-blue-700 text-white;
  }
}

/*
 * TODO consider why this class is defined in this layer, not base.
 * Clearly, Stackoverflow told me to, but I need to learn more about Tailwind to see why or if needed.
 */
@layer components {
  /*
   * We need this to combine with border-seperate, in order not to have gaps between
   * borders of cells within a table.
   * It's seemingly not a utility offered, out-of-the-box, by Tailwind - see:
   * https://stackoverflow.com/a/70326229/392847
   */
  .zero-border-spacing {
    border-spacing: 0;
  }
}
`;

// const configJs = require('./tailwind.config.js.txt');

const configJs = `
// eslint-disable-next-line import/no-extraneous-dependencies
const plugin = require('tailwindcss/plugin');

module.exports = {
  content: ['./output/*.html'],
  theme: {
    extend: {},
  },
  plugins: [
    plugin(({ addUtilities: addAblyUtilities }) => {
      const newUtilities = {
        '.vertical-lr': {
          writingMode: 'vertical-lr',
        },
      };
      addAblyUtilities(newUtilities);
    }),
  ],
};
`;

async function wrapper() {
  // see:
  // - https://github.com/postcss/postcss/tree/main#js-api
  // - https://postcss.org/api/#processor
  const processor = postcss([tailwind, autoprefixer]);
  const outputPath = 'output/tailwind.css';
  fs.writeFileSync('tailwind.config.js', configJs);
  const result = await processor.process(inputCss, {
    from: 'main.css',
    to: outputPath,
  });
  fs.writeFileSync(outputPath, result.css);
}

module.exports = {
  tailwindBuild: wrapper,
};
