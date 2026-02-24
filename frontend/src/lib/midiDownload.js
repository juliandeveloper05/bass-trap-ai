// Decodes a Base64 string into a binary Blob and triggers a browser download.
// We never serve static files from the backend — everything is transferred
// as Base64 inside JSON, then reconstructed here on the client.
export function downloadMidi(b64, filename = 'dumu_output.mid') {
  const binary = atob(b64)                      // Decode Base64 → binary string
  const bytes  = new Uint8Array(binary.length)  // Allocate typed byte array
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)             // Map each char to its byte value
  }
  const blob = new Blob([bytes], { type: 'audio/midi' })
  const url  = URL.createObjectURL(blob)        // Create temporary in-memory URL
  const a    = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)                      // Release memory immediately after click
}