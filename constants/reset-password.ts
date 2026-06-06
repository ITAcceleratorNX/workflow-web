export const RESET_PASSWORD_STEP_TITLES = [
  'Восстановление пароля',
  'Верификация номера',
  'Новый пароль',
  'Пароль изменен',
] as const;

export const RESET_PASSWORD_STEP_SUBTITLES = [
  'Введите номер телефона для восстановления пароля',
  'Введите код из SMS',
  'Придумайте новый пароль',
  'Ваш пароль успешно изменен',
] as const;

export const RESET_PASSWORD_SUCCESS_MESSAGE =
  'Ваш пароль успешно изменен. Теперь вы можете войти в систему с новым паролем.';
