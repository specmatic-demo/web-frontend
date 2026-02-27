import '@testing-library/jest-dom/vitest'
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import path from 'node:path'
import { beforeAll, afterAll } from 'vitest'

const mockPort = 4400
const mockBaseUrl = `http://localhost:${mockPort}`

let mockProcess: ChildProcessWithoutNullStreams | null = null
let originalFetch: typeof fetch | null = null
let mockLogs = ''

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function resolveSpecmaticCommand(): { command: string; args: string[] } {
  const jarPath = path.join(homedir(), '.specmatic', 'specmatic-enterprise.jar')
  if (existsSync(jarPath)) {
    const javaOpts = (process.env.JAVA_OPTS || '').split(/\s+/).filter(Boolean)
    return {
      command: 'java',
      args: ['-Djava.awt.headless=true', ...javaOpts, '-jar', jarPath]
    }
  }

  return { command: 'specmatic-enterprise', args: [] }
}

async function waitForMockReady(): Promise<void> {
  for (let attempt = 0; attempt < 240; attempt += 1) {
    if (mockProcess && mockProcess.exitCode !== null) {
      throw new Error(
        `Specmatic mock process exited early with code ${mockProcess.exitCode}\n${mockLogs}`
      )
    }

    try {
      const response = await fetch(`${mockBaseUrl}/_specmatic/health`)

      if (response.ok) {
        return
      }
    } catch {
      // keep retrying
    }

    await sleep(500)
  }

  throw new Error(`Timed out waiting for Specmatic mock on ${mockBaseUrl}\n${mockLogs}`)
}

beforeAll(async () => {
  const { command, args } = resolveSpecmaticCommand()
  console.log(`Starting Specmatic mock process: ${command} ${[...args, 'mock'].join(' ')}`)
  mockProcess = spawn(command, [...args, 'mock'], {
    cwd: process.cwd(),
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe']
  })

  mockProcess.stdout.on('data', (chunk) => {
    console.log(`[specmatic-mock] [stdout] ${chunk.toString().trim()}`)
    mockLogs += chunk.toString()
  })
  mockProcess.stderr.on('data', (chunk) => {
    console.log(`[specmatic-mock] [stderr] ${chunk.toString().trim()}`)
    mockLogs += chunk.toString()
  })
  mockProcess.on('exit', (code) => {
    mockLogs += `\n[mock-process-exit] code=${code}\n`
  })

  await waitForMockReady()

  originalFetch = globalThis.fetch.bind(globalThis)
  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    if (typeof input === 'string' && input.startsWith('/')) {
      return originalFetch!(`${mockBaseUrl}${input}`, init)
    }

    if (input instanceof URL && input.pathname.startsWith('/')) {
      return originalFetch!(`${mockBaseUrl}${input.pathname}${input.search}`, init)
    }

    return originalFetch!(input, init)
  }) as typeof fetch
})

afterAll(async () => {
  if (originalFetch) {
    globalThis.fetch = originalFetch
    originalFetch = null
  }

  if (mockProcess && !mockProcess.killed) {
    mockProcess.kill('SIGTERM')
    await Promise.race([
      new Promise<void>((resolve) => {
        mockProcess?.once('exit', () => resolve())
      }),
      sleep(2000)
    ])

    if (!mockProcess.killed) {
      mockProcess.kill('SIGKILL')
    }
  }

  mockProcess = null
})
