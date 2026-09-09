<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;
use App\Models\AsetInventaris;
use App\Models\Asset;
use App\Models\AssetMutation;
use App\Models\AssetBorrowing;
use App\Models\User;
use App\Policies\AsetInventarisPolicy;
use App\Policies\AssetPolicy;
use App\Policies\AssetMutationPolicy;
use App\Policies\AssetBorrowingPolicy;
use App\Policies\UserPolicy;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        AsetInventaris::class => AsetInventarisPolicy::class,
        Asset::class => AssetPolicy::class,
        AssetMutation::class => AssetMutationPolicy::class,
        AssetBorrowing::class => AssetBorrowingPolicy::class,
        User::class => UserPolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     *
     * @return void
     */
    public function boot()
    {
        $this->registerPolicies();

        // additional gates can be defined here if needed
    }
}
