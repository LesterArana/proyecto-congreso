// client/src/components/SpeakerCard.js
export default function SpeakerCard({ s }) {
  return (
    <div className="border border-slate-200 rounded-2xl bg-white shadow-sm p-4 hover:shadow-md transition">
      <div className="flex gap-4 items-start">
        {s.photo ? (
          <img
            src={s.photo}
            alt={s.name}
            className="w-24 h-24 rounded-xl object-cover border border-slate-200"
          />
        ) : (
          <div className="w-24 h-24 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 text-sm">
            Sin foto
          </div>
        )}

        <div className="flex-1 text-slate-800">
          <div className="font-bold text-lg text-umgBlue">{s.name}</div>
          <div className="text-slate-500 text-sm">{s.role}</div>
          <div className="mt-2">
            <b className="text-slate-700">Charla:</b>{" "}
            <span className="text-slate-800">{s.talk}</span>
          </div>
          {s.bio && (
            <div className="mt-2 text-slate-700 text-sm leading-snug">{s.bio}</div>
          )}
        </div>
      </div>
    </div>
  );
}
