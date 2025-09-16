// import { cn } from "@/lib/utils";

export default function TeamScroll({ members, className }) {
  return (
    <div className={("w-full", className)}>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {members.map((member) => (
          <div
            key={member.id}
            className="relative flex-shrink-0 w-48 aspect-[9/16] group cursor-pointer"
          >
            {/* Card with matte finish and shadows */}
            <div className="relative w-full h-full rounded-lg overflow-hidden bg-card shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
              {/* Image */}
              <img
                src={member.image || "/placeholder.svg"}
                alt={member.name}
                className="w-full h-full object-cover"
              />

              {/* Inner shadow overlay for matte effect */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

              {/* Subtle inner shadow for depth */}
              <div className="absolute inset-0 shadow-inner" />

              {/* Text overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <h3 className="font-bold text-lg text-balance leading-tight mb-1">
                  {member.name}
                </h3>
                <p className="text-sm text-white/90 font-medium">
                  {member.role}
                </p>
              </div>

              {/* Hover effect overlay */}
              <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
