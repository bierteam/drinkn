// A WebAuthn failure arrives spread across three objects: @simplewebauthn
// wraps the browser's DOMException in a WebAuthnError, which keeps the
// original on `cause` and adds a `code` naming the case it recognised. Any one
// of them on its own is usually too vague to act on, so collect all three.
export const describe = error => ({
  name: error?.name,
  code: error?.code,
  message: error?.message,
  causeName: error?.cause?.name,
  causeMessage: error?.cause?.message
})

// The console keeps the whole shape; what reaches the screen is prose, since
// none of these names mean anything to the person reading them.
export const log = (stage, error) => {
  const detail = describe(error)
  console.error(`[passkey] ${stage}`, detail, error)
  return detail
}
