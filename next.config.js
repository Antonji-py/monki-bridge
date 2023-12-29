/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "gateway.pinit.io",
      },
      {
        protocol: "https",
        hostname: "arweave.net",
      },
    ],
  },
};

module.exports = nextConfig;
