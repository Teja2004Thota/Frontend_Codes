module.exports = {
  apps: [
    {
      name: "frontend",
      script: "./serve-frontend.cjs",
      interpreter: "node",
      watch: false
    }
  ]
};
