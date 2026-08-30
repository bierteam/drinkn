// @simplewebauthn wraps the DOMException on `cause` and adds a `code`
export const describe = error => ({
  name: error?.name,
  code: error?.code,
  message: error?.message,
  causeName: error?.cause?.name,
  causeMessage: error?.cause?.message
})

// the console keeps the whole shape; the screen gets prose
export const log = (stage, error) => {
  const detail = describe(error)
  console.error(`[passkey] ${stage}`, detail, error)
  return detail
}
