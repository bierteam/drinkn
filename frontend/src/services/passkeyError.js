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

// Short enough to put in front of someone, specific enough to act on. Password
// managers differ in which of these they raise when handing a ceremony over,
// so the tag is what tells one case from another without a devtools session.
export const tag = detail => [detail.code, detail.name, detail.causeName]
  .filter(Boolean)
  .join(' / ') || 'no error name'

export const log = (stage, error) => {
  const detail = describe(error)
  console.error(`[passkey] ${stage}`, detail, error)
  return detail
}
