<?php

use App\Http\Controllers\Api\Admin\FoodSubmissionController;
use App\Http\Controllers\Api\Admin\UserController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\GlobalFoodController;
use App\Http\Controllers\Api\SyncController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
    Route::get('/me', [AuthController::class, 'me'])->middleware('auth:sanctum');
});

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/sync', [SyncController::class, 'sync']);
    Route::get('/global-foods', [GlobalFoodController::class, 'index']);

    Route::prefix('admin')->middleware('role:admin')->group(function () {
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::patch('/users/{user}', [UserController::class, 'update']);
        Route::delete('/users/{user}', [UserController::class, 'destroy']);

        Route::get('/food-submissions', [FoodSubmissionController::class, 'index']);
        Route::patch('/food-submissions/{foodSubmission}', [FoodSubmissionController::class, 'update']);
        Route::delete('/food-submissions/{foodSubmission}', [FoodSubmissionController::class, 'destroy']);
    });
});
