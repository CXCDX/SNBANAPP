const REQUIRED_COLUMNS = ['headline', 'tagline', 'subtext', 'cta', 'badge']

export function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) {
    return { error: 'CSV must contain a header row and at least one data row.' }
  }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''))

  // Validate required columns
  const missing = REQUIRED_COLUMNS.filter(col => !headers.includes(col))
  if (missing.length > 0) {
    return { error: `Required column '${missing[0]}' not found. Download template.` }
  }

  const rows = []
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    if (values.length === 0 || (values.length === 1 && !values[0].trim())) continue
    const row = {}
    headers.forEach((header, idx) => {
      row[header] = (values[idx] || '').trim()
    })
    rows.push(row)
  }

  if (rows.length === 0) {
    return { error: 'No data rows found in CSV.' }
  }

  return { headers, rows }
}

function parseCSVLine(line) {
  const result = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"'
        i++
      } else if (ch === '"') {
        inQuotes = false
      } else {
        current += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === ',') {
        result.push(current)
        current = ''
      } else {
        current += ch
      }
    }
  }
  result.push(current)
  return result
}

export function generateTemplate() {
  const header = REQUIRED_COLUMNS.join(',')
  const rows = [
    '"Shark Power Clean","3 Makine Bir Arada","En güçlü temizlik deneyimi için tasarlandı.","Hemen Al","-20% OFF"',
    '"NinjaKitchen Pro","Mutfağın Yeni Yıldızı","Profesyonel sonuçlar, ev konforunda.","Keşfet","YENİ"',
    '"Shark Navigator","Derinlemesine Temizlik","Her zemin türü için optimize edilmiş teknoloji.","İncele","KAMPANYA"',
  ]
  return header + '\n' + rows.join('\n')
}

export { REQUIRED_COLUMNS }
