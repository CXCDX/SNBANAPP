export const AD_FORMATS = [
  // Instagram
  { id: 'ig-feed',       name: 'Instagram Feed',           width: 1080, height: 1080, platform: 'instagram' },
  { id: 'ig-portrait',   name: 'Instagram Portrait',       width: 1080, height: 1350, platform: 'instagram' },
  // Social
  { id: 'story',         name: 'Story / Reels / TikTok',   width: 1080, height: 1920, platform: 'social' },
  { id: 'tw-feed',       name: 'Twitter/X Feed',           width: 1200, height: 675,  platform: 'social' },
  { id: 'li-feed',       name: 'LinkedIn Feed',            width: 1200, height: 627,  platform: 'social' },
  { id: 'pin',           name: 'Pinterest Pin',            width: 1000, height: 1500, platform: 'social' },
  { id: 'yt-thumb',      name: 'YouTube Thumbnail',        width: 1280, height: 720,  platform: 'social' },
  // Google Ads
  { id: 'gd-responsive', name: 'Google Responsive Display', width: 1200, height: 628,  platform: 'google' },
  { id: 'gd-rectangle',  name: 'Google Medium Rectangle',   width: 300,  height: 250,  platform: 'google' },
  { id: 'gd-lg-rect',    name: 'Google Large Rectangle',    width: 336,  height: 280,  platform: 'google' },
  { id: 'gd-half-page',  name: 'Google Half Page',          width: 300,  height: 600,  platform: 'google' },
  { id: 'gd-wide-sky',   name: 'Google Wide Skyscraper',    width: 160,  height: 600,  platform: 'google' },
  { id: 'gd-leaderboard',name: 'Google Leaderboard',        width: 728,  height: 90,   platform: 'google' },
  // SharkNinja Website
  { id: 'sn-hero',       name: 'SN Hero Banner',           width: 1440, height: 600,  platform: 'sharkninja' },
  { id: 'sn-promo',      name: 'SN Promo Bar',             width: 1440, height: 80,   platform: 'sharkninja' },
  { id: 'sn-product',    name: 'SN Product Card',          width: 800,  height: 800,  platform: 'sharkninja' },
  { id: 'sn-email',      name: 'SN Email Header',          width: 600,  height: 200,  platform: 'sharkninja' },
  { id: 'sn-yt-cover',   name: 'SN YouTube Cover',         width: 2560, height: 1440, platform: 'sharkninja' },
  { id: 'sn-li-cover',   name: 'SN LinkedIn Cover',        width: 1584, height: 396,  platform: 'sharkninja' },
  // Trendyol
  { id: 'ty-kapak-web',  name: 'Mağaza Kapağı Web',        width: 1200, height: 98,   platform: 'trendyol' },
  { id: 'ty-kapak-mobil',name: 'Mağaza Kapağı Mobil',      width: 750,  height: 254,  platform: 'trendyol' },
  { id: 'ty-buyuk',      name: 'Büyük Banner',             width: 1800, height: 855,  platform: 'trendyol' },
  { id: 'ty-kucuk',      name: 'Küçük Banner',             width: 1800, height: 1800, platform: 'trendyol' },
  { id: 'ty-coklu',      name: 'Çoklu Banner',             width: 610,  height: 310,  platform: 'trendyol' },
  { id: 'ty-urun',       name: 'Ürün Görseli',             width: 1200, height: 1800, platform: 'trendyol' },
  // Hepsiburada
  { id: 'hb-banner',     name: 'Mağaza Banner',            width: 3360, height: 840,  platform: 'hepsiburada' },
  { id: 'hb-urun',       name: 'Ürün Görseli',             width: 1500, height: 1500, platform: 'hepsiburada' },
  // Amazon TR
  { id: 'az-store',      name: 'Store Açılış Görseli',     width: 3000, height: 600,  platform: 'amazon_tr' },
  { id: 'az-urun',       name: 'Ürün Ana Görseli',         width: 2000, height: 2000, platform: 'amazon_tr' },
  { id: 'az-aplus',      name: 'A+ Content Banner',        width: 970,  height: 300,  platform: 'amazon_tr' },
]

export function getPlatformFolder(platform) {
  const map = {
    instagram: 'Instagram',
    social: 'Social',
    google: 'Google_Ads',
    sharkninja: 'sharkninja_web',
    trendyol: 'trendyol',
    hepsiburada: 'hepsiburada',
    amazon_tr: 'amazon_tr',
  }
  return map[platform] || 'Other'
}

export function getPlatformLabel(platform) {
  const map = {
    instagram: 'INSTAGRAM',
    social: 'SOCIAL',
    google: 'GOOGLE ADS',
    sharkninja: 'SHARKNINJA',
    trendyol: 'TRENDYOL',
    hepsiburada: 'HEPSIBURADA',
    amazon_tr: 'AMAZON TR',
  }
  return map[platform] || platform.toUpperCase()
}

export function getFormatFolder(format) {
  return format.name.toLowerCase().replace(/[/\s]+/g, '_')
}
