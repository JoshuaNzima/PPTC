import ResultSubmissionForm from "@/components/result-submission-form";

export default function SubmitResults() {
  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      <div className="space-y-2">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900" data-testid="text-submit-results-title">
          Submit Results
        </h2>
        <p className="text-sm sm:text-base text-gray-600">Enter polling center results and upload verification documents</p>
      </div>

      <ResultSubmissionForm />
    </div>
  );
}
