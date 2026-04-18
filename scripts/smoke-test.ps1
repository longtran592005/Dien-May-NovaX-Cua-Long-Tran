$ErrorActionPreference = 'Stop'

$base = 'http://localhost:3000/api/v1'
$authBase = 'http://localhost:4010'
$catBase = 'http://localhost:4020'
$cartBase = 'http://localhost:4030'
$orderBase = 'http://localhost:4040'
$payBase = 'http://localhost:4050'

$pass = 0
$fail = 0
$token = $null
$productId = $null
$productSlug = $null

function Test-Step {
  param(
    [string]$Name,
    [scriptblock]$Action
  )

  try {
    & $Action
    Write-Output "[PASS] $Name"
    $script:pass++
  } catch {
    Write-Output "[FAIL] $Name -> $($_.Exception.Message)"
    $script:fail++
  }
}

Test-Step 'gateway health' {
  $r = Invoke-RestMethod "$base/health"
  if (-not $r.status) { throw 'missing status' }
}

Test-Step 'auth-service health' {
  $r = Invoke-RestMethod "$authBase/health"
  if ($r.status -ne 'ok') { throw 'not ok' }
}

Test-Step 'catalog-service health' {
  $r = Invoke-RestMethod "$catBase/health"
  if ($r.status -ne 'ok') { throw 'not ok' }
}

Test-Step 'cart-service health' {
  $r = Invoke-RestMethod "$cartBase/health"
  if ($r.status -ne 'ok') { throw 'not ok' }
}

Test-Step 'order-service health' {
  $r = Invoke-RestMethod "$orderBase/health"
  if ($r.status -ne 'ok') { throw 'not ok' }
}

Test-Step 'payment-service health' {
  $r = Invoke-RestMethod "$payBase/health"
  if ($r.status -ne 'ok') { throw 'not ok' }
}

Test-Step 'gateway login user' {
  $emails = @('user@email.com', 'user@gmail.com', 'admin@novax.vn')

  foreach ($e in $emails) {
    try {
      $body = @{ email = $e; password = '123456' } | ConvertTo-Json
      $res = Invoke-RestMethod -Method Post -Uri "$base/auth/login" -ContentType 'application/json' -Body $body
      if ($res.accessToken) {
        $script:token = $res.accessToken
        break
      }
    } catch {
      # try next credential
    }
  }

  if (-not $script:token) { throw 'cannot login with test credentials' }
}

Test-Step 'list products via gateway' {
  $r = Invoke-RestMethod "$base/products?page=1&pageSize=5"
  if (-not $r.items -or $r.items.Count -lt 1) { throw 'no products' }
}

Test-Step 'load first product detail' {
  $list = Invoke-RestMethod "$base/products?page=1&pageSize=1"
  $script:productSlug = $list.items[0].slug
  $script:productId = $list.items[0].id

  $d = Invoke-RestMethod "$base/products/$($script:productSlug)"
  if (-not $d.id) { throw 'invalid detail' }
}

Test-Step 'admin analytics endpoint' {
  $headers = @{ Authorization = "Bearer $token" }
  $r = Invoke-RestMethod -Headers $headers "$base/admin/analytics"
  if ($null -eq $r.totalOrders) { throw 'missing totalOrders' }
}

Test-Step 'address list/create/delete flow' {
  $headers = @{ Authorization = "Bearer $token" }
  $null = Invoke-RestMethod -Headers $headers "$base/auth/addresses"

  $newBody = @{
    fullName = 'Smoke Tester'
    phone = '0900000000'
    province = 'hcm'
    district = 'q1'
    ward = 'p1'
    streetAddress = '123 Test Street'
    label = 'Khac'
    isDefault = $false
  } | ConvertTo-Json

  $created = Invoke-RestMethod -Method Post -Headers $headers -Uri "$base/auth/addresses" -ContentType 'application/json' -Body $newBody
  if (-not $created.id) { throw 'create failed' }

  $null = Invoke-RestMethod -Method Delete -Headers $headers -Uri "$base/auth/addresses/$($created.id)"
}

Test-Step 'cart get/put flow' {
  $headers = @{ Authorization = "Bearer $token" }
  $null = Invoke-RestMethod -Headers $headers "$base/cart"

  $body = @{ items = @(@{ productId = $productId; quantity = 1 }) } | ConvertTo-Json -Depth 5
  $r = Invoke-RestMethod -Method Put -Headers $headers -Uri "$base/cart" -ContentType 'application/json' -Body $body
  if ($null -eq $r.items) { throw 'invalid cart response' }
}

Test-Step 'stores and stock endpoints' {
  $null = Invoke-RestMethod "$base/stores"
  $null = Invoke-RestMethod "$base/products/$productId/stock"
}

Test-Step 'payment COD initiate' {
  $headers = @{ Authorization = "Bearer $token" }
  $body = @{
    orderId = 'test-order-' + [guid]::NewGuid().ToString()
    amount = 100000
    method = 'cod'
    returnUrl = 'http://localhost:8080/order-tracking'
  } | ConvertTo-Json
  
  $r = Invoke-RestMethod -Method Post -Headers $headers -Uri "$base/payments/initiate" -ContentType 'application/json' -Body $body
  if ($r.method -ne 'cod') { throw 'invalid payment response' }
}

Test-Step 'payment VNPay initiate' {
  $headers = @{ Authorization = "Bearer $token" }
  $body = @{
    orderId = 'test-order-' + [guid]::NewGuid().ToString()
    amount = 100000
    method = 'vnpay'
    returnUrl = 'http://localhost:8080/order-tracking'
  } | ConvertTo-Json
  
  $r = Invoke-RestMethod -Method Post -Headers $headers -Uri "$base/payments/initiate" -ContentType 'application/json' -Body $body
  if ($r.method -ne 'vnpay' -or -not $r.redirectUrl) { throw 'invalid vnpay response' }
}

Test-Step 'payment MoMo initiate' {
  $headers = @{ Authorization = "Bearer $token" }
  $body = @{
    orderId = 'test-order-' + [guid]::NewGuid().ToString()
    amount = 100000
    method = 'momo'
    returnUrl = 'http://localhost:8080/order-tracking'
  } | ConvertTo-Json
  
  $r = Invoke-RestMethod -Method Post -Headers $headers -Uri "$base/payments/initiate" -ContentType 'application/json' -Body $body
  if ($r.method -ne 'momo') { throw 'invalid momo response' }
}

Test-Step 'submit product review' {
  $headers = @{ Authorization = "Bearer $token" }
  $body = @{ rating = 5; comment = 'Smoke test review' } | ConvertTo-Json
  $r = Invoke-RestMethod -Method Post -Headers $headers -Uri "$base/products/$productId/reviews" -ContentType 'application/json' -Body $body
  if (-not $r.id) { throw 'review failed' }
}

Write-Output "SMOKE RESULT: pass=$pass fail=$fail"
if ($fail -gt 0) { exit 1 }
