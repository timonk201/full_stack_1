const PG_CLIENT_ERRORS = {
  '22P02': 'Неверный формат значения',
  '23502': 'Не заполнено обязательное поле',
  '23503': 'Связанная запись не найдена',
  '23514': 'Значение не проходит проверку в БД',
};

export function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Некорректный JSON в теле запроса' });
  }

  const clientMessage = PG_CLIENT_ERRORS[error.code];
  if (clientMessage) {
    return res.status(400).json({
      error: clientMessage,
      detail: error.message,
    });
  }

  console.error(error);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
}
