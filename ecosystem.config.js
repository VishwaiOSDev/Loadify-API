module.exports = {
  apps : [{
    name: "Loadify-Api",
    script: './server.js',
    watch: false,
    ignore_watch : ["node_modules", "./data"],
    env: {
      NODE_ENV: "development",
    },
    env_production: {
      NODE_ENV: "production",
    }
  }],
};
