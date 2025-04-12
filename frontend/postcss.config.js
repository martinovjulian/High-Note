// postcss.config.js
module.exports = {
  plugins: [
    require('@tailwindcss/postcss')({ // Correct for v3
      config: './tailwind.config.js'
    }),
    require('autoprefixer')
  ],
}