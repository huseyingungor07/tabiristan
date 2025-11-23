/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://tabiristan.com',
  generateRobotsTxt: true,
  // Büyük siteler için sitemap'i böler (5000 URL'de bir)
  sitemapSize: 5000, 
  outDir: 'public',
}