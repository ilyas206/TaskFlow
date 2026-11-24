const messages = {
  403: "Vous n'êtes pas autorisé à effectuer cette action.",
  404: 'Élément introuvable.',
  409: 'Cette action est impossible pour le moment.',
  422: 'Veuillez vérifier les informations saisies.',
}

// Turns an Axios error into a French message. No response means the server is unreachable.
export function getErrorMessage(error) {
  if (!error?.response) {
    return 'Impossible de contacter le serveur.'
  }
  return messages[error.response.status] ?? 'Une erreur est survenue.'
}