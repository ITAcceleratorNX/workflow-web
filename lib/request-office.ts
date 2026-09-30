/** Office IDs are authoritative: matching city/location text leaks requests into unrelated offices. */
export function requestMatchesOffice(
  request: { office_id?: number | null; office?: { id: number } | null },
  officeId: number,
): boolean {
  return (request.office_id ?? request.office?.id) === officeId;
}
