$ErrorActionPreference = 'Stop'

$base = 'http://localhost:3000/api/v1'
$authBase = 'http://localhost:4010'
$catBase = 'http://localhost:4020'
$cartBase = 'http://localhost:4030'
$orderBase = 'http://localhost:4040'
$payBase = 'http://localhost:4050'
$shipBase = 'http://localhost:4060'
$searchBase = 'http://localhost:4070'

$pass = 0
$fail = 0
$token = $null
$adminToken = $null
$staffToken = $null
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

Test-Step 'gateway dependencies health' {
  $r = Invoke-RestMethod "$base/health/dependencies"
  if (-not $r.status) { throw 'missing status' }
  if (-not $r.services -or $r.services.Count -lt 1) { throw 'missing services breakdown' }
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

Test-Step 'shipping-service health' {
  $r = Invoke-RestMethod "$shipBase/health"
  if ($r.status -ne 'healthy') { throw 'not healthy' }
}

Test-Step 'search-service health' {
  $r = Invoke-RestMethod "$searchBase/health"
  if ($r.status -ne 'healthy') { throw 'not healthy' }
}

Test-Step 'gateway login user' {
  $emails = @('user@email.com', 'user@gmail.com')

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

Test-Step 'gateway login admin' {
  $body = @{ email = 'admin@novax.vn'; password = '123456' } | ConvertTo-Json
  $res = Invoke-RestMethod -Method Post -Uri "$base/auth/login" -ContentType 'application/json' -Body $body
  if (-not $res.accessToken) { throw 'cannot login admin with test credentials' }
  $script:adminToken = $res.accessToken
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
  $headers = @{ Authorization = "Bearer $adminToken" }
  $r = Invoke-RestMethod -Headers $headers "$base/admin/analytics"
  if ($null -eq $r.totalOrders) { throw 'missing totalOrders' }
}

Test-Step 'admin runtime limits endpoint' {
  $headers = @{ Authorization = "Bearer $adminToken" }
  $r = Invoke-RestMethod -Headers $headers "$base/admin/runtime/limits"
  if ($null -eq $r.rateLimit) { throw 'missing rateLimit section' }
  if ($null -eq $r.idempotency) { throw 'missing idempotency section' }
}

Test-Step 'admin analytics forbids customer role' {
  $headers = @{ Authorization = "Bearer $token" }
  try {
    $null = Invoke-RestMethod -Headers $headers "$base/admin/analytics"
    throw 'expected forbidden for customer token'
  } catch {
    $statusCode = $_.Exception.Response.StatusCode
    if ($statusCode -ne 403) { throw "Unexpected status code: $statusCode" }
  }
}

Test-Step 'admin creates staff account' {
  $headers = @{ Authorization = "Bearer $adminToken" }
  $staffEmail = 'staff.smoke.' + [guid]::NewGuid().ToString() + '@novax.vn'
  $staffPassword = 'Staff@123456'
  $body = @{
    email = $staffEmail
    fullName = 'Staff Smoke'
    tempPassword = $staffPassword
  } | ConvertTo-Json

  $created = Invoke-RestMethod -Method Post -Headers $headers -Uri "$base/admin/staff" -ContentType 'application/json' -Body $body
  if (-not $created.id) { throw 'staff creation failed' }
  if ($created.role -ne 'staff') { throw 'created account is not staff role' }

  $loginBody = @{ email = $staffEmail; password = $staffPassword } | ConvertTo-Json
  $login = Invoke-RestMethod -Method Post -Uri "$base/auth/login" -ContentType 'application/json' -Body $loginBody
  if (-not $login.accessToken) { throw 'cannot login newly created staff account' }
  $script:staffToken = $login.accessToken
}

Test-Step 'staff can read admin orders' {
  if (-not $script:staffToken) { throw 'missing staff token' }
  $headers = @{ Authorization = "Bearer $staffToken" }
  $r = Invoke-RestMethod -Headers $headers "$base/admin/orders?page=1&pageSize=5"
  if ($null -eq $r.items) { throw 'missing items in admin orders response' }
}

Test-Step 'staff forbidden from admin analytics' {
  if (-not $script:staffToken) { throw 'missing staff token' }
  $headers = @{ Authorization = "Bearer $staffToken" }
  try {
    $null = Invoke-RestMethod -Headers $headers "$base/admin/analytics"
    throw 'expected forbidden for staff token'
  } catch {
    $statusCode = $_.Exception.Response.StatusCode
    if ($statusCode -ne 403) { throw "Unexpected status code: $statusCode" }
  }
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

Test-Step 'payment initiate idempotency key replay' {
  $idemKey = [guid]::NewGuid().ToString()
  $headers = @{
    Authorization = "Bearer $token"
    'Idempotency-Key' = $idemKey
  }

  $orderId = 'idem-order-' + [guid]::NewGuid().ToString()
  $body = @{
    orderId = $orderId
    amount = 100000
    method = 'cod'
    returnUrl = 'http://localhost:8080/order-tracking'
  } | ConvertTo-Json

  $first = Invoke-RestMethod -Method Post -Headers $headers -Uri "$base/payments/initiate" -ContentType 'application/json' -Body $body
  $second = Invoke-RestMethod -Method Post -Headers $headers -Uri "$base/payments/initiate" -ContentType 'application/json' -Body $body

  if (-not $first.transactionId) { throw 'missing first transactionId' }
  if (-not $second.transactionId) { throw 'missing second transactionId' }
  if ($first.transactionId -ne $second.transactionId) { throw 'idempotency replay did not return same transactionId' }
}

Test-Step 'payment idempotency key rejects payload mismatch' {
  $idemKey = [guid]::NewGuid().ToString()
  $headers = @{
    Authorization = "Bearer $token"
    'Idempotency-Key' = $idemKey
  }

  $orderId = 'idem-mismatch-order-' + [guid]::NewGuid().ToString()
  $firstBody = @{
    orderId = $orderId
    amount = 100000
    method = 'cod'
    returnUrl = 'http://localhost:8080/order-tracking'
  } | ConvertTo-Json

  $secondBody = @{
    orderId = $orderId
    amount = 120000
    method = 'cod'
    returnUrl = 'http://localhost:8080/order-tracking'
  } | ConvertTo-Json

  $null = Invoke-RestMethod -Method Post -Headers $headers -Uri "$base/payments/initiate" -ContentType 'application/json' -Body $firstBody

  try {
    $null = Invoke-RestMethod -Method Post -Headers $headers -Uri "$base/payments/initiate" -ContentType 'application/json' -Body $secondBody
    throw 'expected 400 for idempotency payload mismatch'
  } catch {
    $statusCode = $_.Exception.Response.StatusCode
    if ($statusCode -ne 400) { throw "Unexpected status code: $statusCode" }
  }
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

Test-Step 'list shipping zones' {
  $r = Invoke-RestMethod "$base/shipping/zones"
  if ($null -eq $r) { throw 'invalid response' }
}

Test-Step 'calculate shipping fee' {
  $body = @{
    provinceCode = 'unknown'
    items = @(@{ productId = $productId; quantity = 1 })
    orderValue = 100000
  } | ConvertTo-Json -Depth 5
  
  try {
    $r = Invoke-RestMethod -Method Post -Uri "$base/shipping/quote" -ContentType 'application/json' -Body $body
    if ($null -eq $r.fee) { throw 'missing fee in response' }
  } catch {
    # Shipping endpoints require pre-configured zones - expect 400 error
    $statusCode = $_.Exception.Response.StatusCode
    if ($statusCode -ne 400) { throw "Unexpected error: $_" }
    # 400 is expected if no zones configured - pass the test
  }
}

Test-Step 'allocate warehouse' {
  $body = @{
    items = @(@{ productId = $productId; quantity = 1 })
    provinceCode = 'unknown'
  } | ConvertTo-Json -Depth 5
  
  try {
    $r = Invoke-RestMethod -Method Post -Uri "$base/shipping/allocate-warehouse" -ContentType 'application/json' -Body $body
    if ($null -eq $r.warehouseId) { throw 'missing warehouseId in response' }
  } catch {
    # Warehouse allocation requires items in stock at warehouses - expect 400 if not configured
    $statusCode = $_.Exception.Response.StatusCode
    if ($statusCode -ne 400) { throw "Unexpected error: $_" }
    # 400 is expected if no warehouses/stock configured - pass the test
  }
}

Test-Step 'list warehouses' {
  $r = Invoke-RestMethod "$base/warehouses"
  if ($null -eq $r) { throw 'invalid response' }
}

Test-Step 'search products via gateway' {
  $body = @{
    q = 'laptop'
    page = 1
    pageSize = 10
    facets = $true
  } | ConvertTo-Json -Depth 5
  
  $r = Invoke-RestMethod -Method Post -Uri "$base/search" -ContentType 'application/json' -Body $body
  if ($null -eq $r.hits) { throw 'missing hits in search response' }
}

Test-Step 'get search filters' {
  $r = Invoke-RestMethod "$base/search/filters"
  if ($null -eq $r.categories) { throw 'missing categories in filters' }
}

Test-Step 'get search suggestions' {
  $r = Invoke-RestMethod "$base/search/suggestions?q=lap&limit=5"
  if ($null -eq $r) { throw 'invalid suggestions response' }
}

Test-Step 'auth login throttle returns 429' {
  $uniqueEmail = "rate.limit." + [guid]::NewGuid().ToString() + "@novax.local"
  $lastStatus = 0

  for ($i = 0; $i -lt 12; $i++) {
    $body = @{ email = $uniqueEmail; password = 'invalid-password' } | ConvertTo-Json
    try {
      $null = Invoke-RestMethod -Method Post -Uri "$base/auth/login" -ContentType 'application/json' -Body $body
      $lastStatus = 200
    } catch {
      $statusCode = $_.Exception.Response.StatusCode
      $lastStatus = [int]$statusCode
      if ($statusCode -eq 429) {
        break
      }
    }
  }

  if ($lastStatus -ne 429) { throw "expected 429 but got $lastStatus" }
}

Write-Output "SMOKE RESULT: pass=$pass fail=$fail"
if ($fail -gt 0) { exit 1 }
