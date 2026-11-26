<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Api\ChatAiStreamController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/dashboard', function () {
    return view('dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/chat', fn () => view('chat.index'))->name('chat.index');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::post('/chat-ai/stream', ChatAiStreamController::class)->name('chat-ai.stream');
});

require __DIR__.'/auth.php';
