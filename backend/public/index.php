<?php

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Determine if the application is in maintenance mode...
if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

// Register the Composer autoloader...
require __DIR__.'/../vendor/autoload.php';

// Shared hosting without doc-root control (see backend/.htaccess): this app
// is reached one directory above public/ (e.g. https://host/basixmacro-api/...),
// so the client's REQUEST_URI never contains "/public". SCRIPT_NAME does,
// though, since that's where index.php actually lives on disk — Symfony's
// base-path detection needs the two to agree, or it fails to strip the app's
// own prefix and no route ever matches. Stripping "/public" here realigns them.
if (isset($_SERVER['SCRIPT_NAME'])) {
    $_SERVER['SCRIPT_NAME'] = str_replace('/public/index.php', '/index.php', $_SERVER['SCRIPT_NAME']);
}

// Bootstrap Laravel and handle the request...
/** @var Application $app */
$app = require_once __DIR__.'/../bootstrap/app.php';

$app->handleRequest(Request::capture());
