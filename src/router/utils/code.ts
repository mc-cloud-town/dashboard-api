export enum ResponseStatusCode {
  // Success
  SUCCESS,
  // Not found
  NOT_FOUND,
  // Oauth2 URL get error
  GET_AUTH_URL_ERROR,
  // In oauth2 callback code not found
  OAUTH_CODE_CALLBACK_ERROR,
  // In oauth2 callback auth error
  AUTH_ERROR,
  // Use gmail verification, but not verified
  AUTH_EMAIL_NOT_VERIFIED,
  // Is not CTEC member
  NOT_CTEC_MEMBER,
}
