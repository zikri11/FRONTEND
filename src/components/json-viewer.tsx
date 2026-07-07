import { useMemo } from 'react'

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// Read-only JSON syntax highlighter (VS Code / Vercel palette). Tokenizes a
// single already-indented line — JSON.stringify never splits a token across
// lines, so per-line highlighting is safe and cheap.
function highlightLine(line: string) {
  return escapeHtml(line).replace(
    /("(?:\\.|[^"\\])*"(?:\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g,
    (m) => {
      let color = '#b5cea8' // number (green)
      if (m.startsWith('"')) {
        color = /:\s*$/.test(m) ? '#9cdcfe' : '#ce9178' // key (blue) vs string (orange)
      } else if (m === 'true' || m === 'false' || m === 'null') {
        color = '#569cd6' // keyword (blue)
      }
      return `<span style="color:${color}">${m}</span>`
    }
  )
}

export function JsonViewer({ data }: { data: unknown }) {
  const lines = useMemo(() => JSON.stringify(data, null, 2).split('\n'), [data])
  const rendered = useMemo(
    () => lines.map((line) => highlightLine(line) || '&nbsp;'),
    [lines]
  )
  return (
    <div className='max-h-[65vh] overflow-auto rounded-lg border border-white/10 bg-[#0d1117] font-mono text-[13px] leading-6'>
      <div className='min-w-fit py-3'>
        {rendered.map((html, i) => (
          <div key={i} className='flex whitespace-pre'>
            <span className='sticky left-0 z-10 w-12 shrink-0 select-none border-r border-white/5 bg-[#0d1117] px-3 text-right text-white/25'>
              {i + 1}
            </span>
            <code
              className='flex-1 pe-4 ps-4 text-[#c9d1d9]'
              // Safe: input is HTML-escaped before token spans are added.
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
