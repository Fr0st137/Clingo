$ErrorActionPreference = "Stop"

$port = 8080
$root = Split-Path -Parent $MyInvocation.MyCommand.Path

$contentTypes = @{
  ".html" = "text/html; charset=utf-8"
  ".css" = "text/css; charset=utf-8"
  ".js" = "application/javascript; charset=utf-8"
  ".json" = "application/json; charset=utf-8"
  ".svg" = "image/svg+xml"
  ".png" = "image/png"
  ".jpg" = "image/jpeg"
  ".jpeg" = "image/jpeg"
  ".gif" = "image/gif"
  ".webp" = "image/webp"
  ".ico" = "image/x-icon"
}

$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $port)
$listener.Start()

Write-Host "Serving $root at http://localhost:$port/"

function Send-Response {
  param(
    [Parameter(Mandatory = $true)] $Client
  )

  $stream = $Client.GetStream()
  $reader = New-Object System.IO.StreamReader($stream, [System.Text.Encoding]::ASCII, $false, 1024, $true)

  try {
    $requestLine = $reader.ReadLine()

    if ([string]::IsNullOrWhiteSpace($requestLine)) {
      return
    }

    while ($true) {
      $line = $reader.ReadLine()
      if ([string]::IsNullOrEmpty($line)) {
        break
      }
    }

    $parts = $requestLine.Split(' ')
    if ($parts.Length -lt 2) {
      return
    }

    $method = $parts[0].ToUpperInvariant()
    $rawPath = $parts[1]

    if ($method -ne "GET") {
      $body = [System.Text.Encoding]::UTF8.GetBytes("Method Not Allowed")
      $header = "HTTP/1.1 405 Method Not Allowed`r`nContent-Type: text/plain; charset=utf-8`r`nContent-Length: $($body.Length)`r`nConnection: close`r`n`r`n"
      $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($header)
      $stream.Write($headerBytes, 0, $headerBytes.Length)
      $stream.Write($body, 0, $body.Length)
      return
    }

    $requestPath = $rawPath.Split('?')[0].TrimStart('/')
    $requestPath = [System.Uri]::UnescapeDataString($requestPath)

    if ([string]::IsNullOrWhiteSpace($requestPath)) {
      $requestPath = "index.html"
    }

    $fullPath = [System.IO.Path]::GetFullPath((Join-Path $root $requestPath))

    if (-not $fullPath.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase)) {
      $body = [System.Text.Encoding]::UTF8.GetBytes("Forbidden")
      $header = "HTTP/1.1 403 Forbidden`r`nContent-Type: text/plain; charset=utf-8`r`nContent-Length: $($body.Length)`r`nConnection: close`r`n`r`n"
      $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($header)
      $stream.Write($headerBytes, 0, $headerBytes.Length)
      $stream.Write($body, 0, $body.Length)
      return
    }

    if (-not (Test-Path -LiteralPath $fullPath -PathType Leaf)) {
      $body = [System.Text.Encoding]::UTF8.GetBytes("Not Found")
      $header = "HTTP/1.1 404 Not Found`r`nContent-Type: text/plain; charset=utf-8`r`nContent-Length: $($body.Length)`r`nConnection: close`r`n`r`n"
      $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($header)
      $stream.Write($headerBytes, 0, $headerBytes.Length)
      $stream.Write($body, 0, $body.Length)
      return
    }

    $extension = [System.IO.Path]::GetExtension($fullPath).ToLowerInvariant()
    $contentType = $contentTypes[$extension]
    if (-not $contentType) {
      $contentType = "application/octet-stream"
    }

    $body = [System.IO.File]::ReadAllBytes($fullPath)
    $header = "HTTP/1.1 200 OK`r`nContent-Type: $contentType`r`nContent-Length: $($body.Length)`r`nConnection: close`r`n`r`n"
    $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($header)
    $stream.Write($headerBytes, 0, $headerBytes.Length)
    $stream.Write($body, 0, $body.Length)
  }
  catch [System.IO.IOException] {
    # Browsers sometimes close the socket before the response is fully written.
    return
  }
  catch [System.Net.Sockets.SocketException] {
    return
  }
  catch [System.ObjectDisposedException] {
    return
  }
  finally {
    $reader.Dispose()
    $stream.Dispose()
    $Client.Dispose()
  }
}

try {
  while ($true) {
    $client = $listener.AcceptTcpClient()
    try {
      Send-Response -Client $client
    }
    catch [System.IO.IOException] {
      continue
    }
    catch [System.Net.Sockets.SocketException] {
      continue
    }
  }
}
finally {
  $listener.Stop()
}
