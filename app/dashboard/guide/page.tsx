import Link from "next/link"

export default function DashboardGuidePage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 space-y-8 text-gray-100">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-wide text-emerald-400">ExCon Dashboard</p>
        <h1 className="text-3xl font-semibold text-white">Controller Guide &amp; Manual</h1>
        <p className="text-base text-gray-300">
          This guide gives exercise controllers and support staff a quick orientation to the ExCon dashboard so sessions start
          smoothly and stay on track.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-white">Who This Dashboard Is For</h2>
        <p className="text-base text-gray-300">
          The dashboard is built for controllers, evaluators, and exercise support personnel coordinating training events. It
          centralizes the master schedule of events (MSE), resource requests, and timing so your team can keep the exercise
          synchronized in real time.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-white">Core Capabilities</h2>
        <ul className="list-disc space-y-2 pl-6 text-base text-gray-300">
          <li><strong className="text-gray-100">Exercise Overview:</strong> Track the scenario name, controller on shift, and planned end time.</li>
          <li><strong className="text-gray-100">Live Timer Control:</strong> Start, pause, and reset the master clock, or pop out a dedicated timer window.</li>
          <li><strong className="text-gray-100">Master Schedule of Events:</strong> Review, sequence, and manage inject delivery with due times and status updates.</li>
          <li><strong className="text-gray-100">Resource Coordination:</strong> Monitor resource requests, update status, and log ETAs in one place.</li>
          <li><strong className="text-gray-100">Activity Log &amp; Reporting:</strong> Export JSON data, audit logs, or a printable PDF summary at end of exercise.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-white">Getting Started</h2>
        <ol className="list-decimal space-y-2 pl-6 text-base text-gray-300">
          <li>Confirm the exercise title, controller name, and planned finish time in the Exercise Overview panel.</li>
          <li>Import an existing scenario via <em className="text-gray-200">Import Exercise</em> or start fresh by adding injects manually.</li>
          <li>Use the timer controls to start the session; designate a single browser window as the timer leader when prompted.</li>
          <li>Configure timeline filters to focus on inject types or resource statuses relevant to your current phase.</li>
        </ol>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-white">During the Exercise</h2>
        <ul className="list-disc space-y-2 pl-6 text-base text-gray-300">
          <li>Update inject statuses as they progress from scheduled to delivered or skipped; log notes for after-action reviews.</li>
          <li>Capture resource movements by adjusting requested, tasked, en route, arrived, or cancelled states.</li>
          <li>Keep an eye on due-time alerts so critical injects are never missed.</li>
          <li>Use the activity log to document major controller actions for a clean audit trail.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-white">Wrap-Up Checklist</h2>
        <ol className="list-decimal space-y-2 pl-6 text-base text-gray-300">
          <li>Pause the timer and confirm all injects have final statuses recorded.</li>
          <li>Export the exercise JSON for archival or future reloads.</li>
          <li>Download the activity log if you need a detailed controller record.</li>
          <li>Generate the PDF report to share a concise summary with stakeholders.</li>
        </ol>
      </section>

      <section className="rounded-xl border border-gray-700/60 bg-gray-800/50 p-6">
        <h2 className="text-xl font-semibold text-white">Need More Help?</h2>
        <p className="mt-3 text-base text-gray-300">
          Questions, feature ideas, or feedback on the dashboard? Contact Mark Charles at
          <a className="ml-2 text-emerald-400 hover:text-emerald-300 underline" href="mailto:mpcharles@gmail.com">mpcharles@gmail.com</a>
          . We appreciate hearing how the tool supports your exercises.
        </p>
      </section>

      <footer>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-emerald-500"
        >
          Back to Dashboard
        </Link>
      </footer>
    </div>
  )
}
