<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('asset_borrowings', function (Blueprint $table) {
            if (!Schema::hasColumn('asset_borrowings', 'quantity')) {
                $table->unsignedInteger('quantity')->default(1)->after('asset_id');
            }

            if (!Schema::hasColumn('asset_borrowings', 'borrower_names')) {
                $table->text('borrower_names')->nullable()->after('borrower_name');
            }

            if (!Schema::hasColumn('asset_borrowings', 'loan_time')) {
                $table->time('loan_time')->nullable()->after('loan_date');
            }

            if (!Schema::hasColumn('asset_borrowings', 'due_time')) {
                $table->time('due_time')->nullable()->after('due_date');
            }

            if (!Schema::hasColumn('asset_borrowings', 'return_time')) {
                $table->time('return_time')->nullable()->after('return_date');
            }
        });
    }

    public function down(): void
    {
        Schema::table('asset_borrowings', function (Blueprint $table) {
            $table->dropColumn(['quantity', 'borrower_names', 'loan_time', 'due_time', 'return_time']);
        });
    }
};
