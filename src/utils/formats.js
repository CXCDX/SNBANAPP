export const AD_FORMATS = [
  { id: 'ig-feed',       name: 'Instagram Feed',           width: 1080, height: 1080, platform: 'instagram' },
  { id: 'ig-portrait',   name: 'Instagram Portrait',       width: 1080, height: 1350, platform: 'instagram' },
  { id: 'story',         name: 'Story / Reels / TikTok',   width: 1080, height: 1920, platform: 'social' },
  { id: 'gd-display',    name: 'Google Display',            width: 1200, height: 628,  platform: 'google' },
  { id: 'gd-rectangle',  name: 'Google Medium Rectangle',   width: 300,  height: 250,  platform: 'google' },
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
