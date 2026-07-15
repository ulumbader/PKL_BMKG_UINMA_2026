<?php

namespace App\Providers;

use App\Models\DataIklimHarian;
use App\Models\KontenLandingPage;
use App\Models\RingkasanAi;
use App\Models\RuleRekomendasi;
use App\Observers\AuditLogObserver;
use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Listeners\SendEmailVerificationNotification;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Event;

class EventServiceProvider extends ServiceProvider
{
    /**
     * The event to listener mappings for the application.
     *
     * @var array<class-string, array<int, class-string>>
     */
    protected $listen = [
        Registered::class => [
            SendEmailVerificationNotification::class,
        ],
    ];

    /**
     * Register any events for your application.
     *
     * Mendaftarkan AuditLogObserver untuk model-model penting
     * yang boleh diubah admin. Observer ini otomatis menulis
     * entry ke tabel audit_log pada event created/updated/deleted.
     */
    public function boot(): void
    {
        DataIklimHarian::observe(AuditLogObserver::class);
        RuleRekomendasi::observe(AuditLogObserver::class);
        KontenLandingPage::observe(AuditLogObserver::class);
        RingkasanAi::observe(AuditLogObserver::class);
    }

    /**
     * Determine if events and listeners should be automatically discovered.
     */
    public function shouldDiscoverEvents(): bool
    {
        return false;
    }
}
