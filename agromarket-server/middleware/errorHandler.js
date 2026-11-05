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

  console.error(`[${req.method} ${req.originalUrl}]`, error);

  const requestedStatus = error.status || error.statusCode;
  const status = Number.isInteger(requestedStatus) && requestedStatus >= 400 && requestedStatus <= 599
    ? requestedStatus
    : 500;
  const isProd = process.env.NODE_ENV === 'production';

  if (error.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Слишком большой запрос' });
  }

  if (error.code === '23505') {
    return res.status(409).json({ error: 'Такая запись уже существует' });
  }
  
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Некорректный JSON в теле запроса' });
  }

  const clientMessage = PG_CLIENT_ERRORS[error.code];
  const responseStatus = clientMessage ? 400 : status;
  const responseMessage = clientMessage || error.message || 'Внутренняя ошибка сервера';

  res.status(responseStatus).json({
    error: responseStatus >= 500 && isProd
      ? 'Внутренняя ошибка сервера'
      : responseMessage,
  });
}
