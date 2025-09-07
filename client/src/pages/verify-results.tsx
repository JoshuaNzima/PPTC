import VerificationInterface from "@/components/verification-interface";

export default function VerifyResults() {
  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      <div className="space-y-2">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900" data-testid="text-verify-results-title">
          Verify Results
        </h2>
        <p className="text-sm sm:text-base text-gray-600">Review and verify submitted results</p>
      </div>

      <VerificationInterface />
    </div>
  );
}
