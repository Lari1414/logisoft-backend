import { createServer } from './server'

const start = async () => {
  const PORT = parseInt(process.env.PORT || '8080', 10)
  const app = createServer()
  try {
    await app.listen({ port: PORT, host: '0.0.0.0' })
    console.log(`Server is listening on http://0.0.0.0:${PORT}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
