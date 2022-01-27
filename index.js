const express = require('express')
const fetch = require('node-fetch')
const {createInterceptor} = require('@mswjs/interceptors')
const nodeInterceptors = require('@mswjs/interceptors/lib/presets/node').default

const app = express()
const port = 3000

function _instrumentHTTPTraffic() {
  const interceptor = createInterceptor({
    resolver: () => {}, // Required even if not used
    modules: nodeInterceptors,
  })

  interceptor.on('request', _handleHttpRequest)

  interceptor.on('response', _handleHttpResponse)

  interceptor.apply()
}

function _handleHttpRequest(request) {
  console.log('>>> _handleHttpRequest')
  const url = request.url.toString()
  const method = String(request.method)
  const headers = request.headers.raw()
  const body = request.body

  const requestEvent = {headers, method, url, body}

  // Intentionally not waiting for a response to avoid adding any latency with this instrumentation
  LogRequest(requestEvent)
}

function _handleHttpResponse(request, response) {
  console.log('>>> _handleHttpResponse')
  const url = request.url.toString()
  const headers = request.headers.raw()

  const responseEvent = {
    url: request.url.toString(),
    method: request.method,
    body: response.body,
    headers: response.headers.raw(),
    statusCode: response.status,
  }

  // Intentionally not waiting for a response to avoid adding any latency with this instrumentation
  LogResponse(responseEvent)
}

function LogRequest(requestEvent) {
  console.log('>>> REQUEST >>> ', requestEvent)
}

function LogResponse(responseEvent) {
  console.log('>>> RESPONSE >>> ', responseEvent)
}

_instrumentHTTPTraffic()

app.get('/', async (req, res) => {
  try {
    const fakeData = `https://jsonplaceholder.typicode.com/posts/1/comments`
    const response = await fetch(fakeData)
    const json = await response.json()
    // console.log(json)
    res.json(json)
  } catch (error) {
    console.log('>>> ', error)
    res.send(error)
  }
})

app.get('/sample-post', async (req, res) => {
  try {
    const postRes = await fetch('https://jsonplaceholder.typicode.com/posts', {
      method: 'post',
      body: JSON.stringify({
        title: 'foo',
        body: 'bar',
        userId: 1,
      }),
      headers: {'Content-Type': 'application/json'},
    })

    const data = await postRes.json()

    res.send(data)
  } catch (error) {
    console.log('>>> ', error)
    res.send(error)
  }
})

app.listen(port, () => {
  console.log(`Example app running at http://localhost:${port}`)
})
