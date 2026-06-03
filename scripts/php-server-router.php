<?php
/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/

/**
 * PHP built-in server router for the E2E harness (`scripts/e2e-stack.mjs`).
 *
 * Why this exists: the `php -S` SAPI does NOT expose the launching process's
 * environment in `$_SERVER`/`$_ENV` per request (only the CLI/console SAPI
 * does), and Symfony's `Dotenv::bootEnv()` resolves `APP_ENV`/`APP_DEBUG`
 * from `$_SERVER`/`$_ENV` — never `getenv()`. A backend started with
 * `APP_ENV=test php -S …` would otherwise boot the WRONG environment (dev),
 * hit the dev database, and fail every QA login.
 *
 * A router script is the built-in server's guaranteed per-request entry point
 * (unlike `auto_prepend_file`, which the server does not apply here). It copies
 * the relevant vars from `getenv()` (which the built-in server DOES populate)
 * into `$_SERVER`/`$_ENV`, serves real static files as-is, and hands everything
 * else to Symfony's front controller.
 *
 * Must be launched WITH `-t public` so `$_SERVER['DOCUMENT_ROOT']` points at
 * the Symfony public dir:
 *
 *   APP_ENV=test php -S 127.0.0.1:8000 -t public scripts/php-server-router.php
 */

foreach (['APP_ENV', 'APP_DEBUG', 'APP_SECRET', 'DATABASE_URL', 'REDIS_URL'] as $key) {
    $value = getenv($key);
    if ($value !== false) {
        $_SERVER[$key] = $value;
        $_ENV[$key] = $value;
    }
}

$docRoot = getenv('SELFHELP_PUBLIC_DIR') ?: ($_SERVER['DOCUMENT_ROOT'] ?? '');
if ($docRoot === '' || !is_dir($docRoot)) {
    $docRoot = getcwd() . DIRECTORY_SEPARATOR . 'public';
}

$uriPath = urldecode((string) parse_url((string) ($_SERVER['REQUEST_URI'] ?? '/'), PHP_URL_PATH));

// Let the built-in server serve real files (assets, uploads) untouched.
if ($uriPath !== '/' && $uriPath !== '' && is_file($docRoot . $uriPath)) {
    return false;
}

// Everything else goes through the Symfony front controller.
$_SERVER['SCRIPT_FILENAME'] = $docRoot . '/index.php';
$_SERVER['SCRIPT_NAME'] = '/index.php';
$_SERVER['PHP_SELF'] = '/index.php';

require $docRoot . '/index.php';
