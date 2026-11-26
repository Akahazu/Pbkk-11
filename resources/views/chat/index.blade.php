<x-app-layout>
    <x-slot name="header">
        <div class="flex items-center justify-between">
            <h2 class="font-semibold text-xl text-primary leading-tight">
                {{ __('SOC Agentic AI Chat Hub') }}
            </h2>
            <span class="text-xs text-gray-500">Livewire Workspace</span>
        </div>
    </x-slot>

    <div class="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 md:grid-cols-12 gap-4 h-[80vh]">
            <div class="md:col-span-4 lg:col-span-3 h-full overflow-y-auto bg-white rounded-lg shadow">
                <livewire:chat-sidebar />
            </div>

            <div class="md:col-span-8 lg:col-span-9 h-full bg-white rounded-lg shadow flex flex-col overflow-hidden">
                <livewire:chat-workspace />
            </div>
        </div>
    </div>
</x-app-layout>
