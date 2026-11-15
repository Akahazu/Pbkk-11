<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ChatAiController;
use App\Http\Controllers\Api\ChatAiStreamController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware(['auth:sanctum'])->get('/user', function (Request $request) {
    return $request->user();
});

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/chat-ai', ChatAiController::class);
    Route::post('/chat-ai/stream', ChatAiStreamController::class);
});
