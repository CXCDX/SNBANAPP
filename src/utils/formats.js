export const AD_FORMATS = [
  // Instagram
  { id: 'ig-feed',       name: 'Instagram Feed',           width: 1080, height: 1080, platform: 'instagram' },
  { id: 'ig-portrait',   name: 'Instagram Portrait',       width: 1080, height: 1350, platform: 'instagram' },
  { id: 'story',         name: 'Story / Reels / TikTok',   width: 1080, height: 1920, platform: 'social' },
  // Twitter / LinkedIn / Pinterest / YouTube
  { id: 'tw-feed',       name: 'Twitter/X Feed',           width: 1200, height: 675,  platform: 'social' },
  { id: 'li-feed',       name: 'LinkedIn Feed',            width: 1200, height: 627,  platform: 'social' },
  { id: 'pin',           name: 'Pinterest Pin',            width: 1000, height: 1500, platform: 'social' },
  { id: 'yt-thumb',      name: 'YouTube Thumbnail',        width: 1280, height: 720,  platform: 'social' },
  // Google
  { id: 'gd-responsive', name: 'Google Responsive Display', width: 1200, height: 628,  platform: 'google' },
  { id: 'gd-rectangle',  name: 'Google Medium Rectangle',   width: 300,  height: 250,  platform: 'google' },
  { id: 'gd-lg-rect',    name: 'Google Large Rectangle',    width: 336,  height: 280,  platform: 'google' },
  { id: 'gd-half-page',  name: 'Google Half Page',          width: 300,  height: 600,  platform: 'google' },
  { id: 'gd-wide-sky',   name: 'Google Wide Skyscraper',    width: 160,  height: 600,  platform: 'google' },
  { id: 'gd-leaderboard',name: 'Google Leaderboard',        width: 728,  height: 90,   platform: 'google' },
]

export function getPlatformFolder(platform) {
  const map = {
    instagram: 'Instagram',
    social: 'Social',
    google: 'Google_Ads',
  }
  return map[platform] || 'Other'
}
