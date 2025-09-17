import React from "react";

const About = () => {
  const teamMembers = [
    {
      id: 1,
      name: "Sarah Chen",
      role: "CEO & Founder",
      link: "https://linkedin.com/in/sarahchen", // add link here

      image:
        "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400",
    },
    {
      id: 2,
      name: "Marcus Johnson",
      role: "CTO",
      image:
        "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400",
    },
    {
      id: 3,
      name: "Elena Rodriguez",
      role: "Creative Director",
      image:
        "https://images.pexels.com/photos/1181519/pexels-photo-1181519.jpeg?auto=compress&cs=tinysrgb&w=400",
    },
    {
      id: 4,
      name: "David Park",
      role: "Lead Developer",
      image:
        "https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=400",
    },
    {
      id: 5,
      name: "Sophie Williams",
      role: "UX Designer",
      image:
        "https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=400",
    },
    {
      id: 6,
      name: "Alex Thompson",
      role: "Product Manager",
      image:
        "https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=400",
    },
    {
      id: 7,
      name: "Maya Patel",
      role: "Marketing Lead",
      image:
        "https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=400",
    },
    {
      id: 8,
      name: "Jordan Smith",
      role: "Data Scientist",
      image:
        "https://images.pexels.com/photos/2381069/pexels-photo-2381069.jpeg?auto=compress&cs=tinysrgb&w=400",
    },
    {
      id: 9,
      name: "Riley Anderson",
      role: "Operations Manager",
      image:
        "https://images.pexels.com/photos/1181605/pexels-photo-1181605.jpeg?auto=compress&cs=tinysrgb&w=400",
    },
  ];

  return (
    <div className="min-h-screen o` py-16 px-4 relative overflow-hidden">
      {/* Background animated elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#01ffdb]/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#01ffdb]/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-[#01ffdb]/8 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-gray-200 to-[#01ffdb] bg-clip-text text-transparent">
            About Us
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            This <span className="text-[#01ffdb] font-semibold">CTF event</span>{" "}
            is proudly
            <span className="font-semibold"> hosted and organised</span> by our
            exceptional team of innovators, creators, and visionaries.
          </p>
        </div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {teamMembers.map((member, index) => (
            <a
              key={member.id}
              href={member.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group cursor-pointer"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <div className="relative w-full aspect-[3/4] scale-85 rounded-2xl overflow-hidden transform transition-all duration-500 hover:scale-95 hover:-translate-y-2 animate-[fadeInUp_0.8s_ease-out_forwards] opacity-0">
                {/* Glass background */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/80 border-white/10 rounded-2xl"></div>

                {/* Cyan glow effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#01ffdb]/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>

                {/* Image */}
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-full object-cover rounded-2xl group-hover:opacity-90 transition-opacity duration-500"
                />

                {/* Content overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent rounded-2xl"></div>

                {/* Text content */}
                <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#01ffdb] transition-colors duration-300">
                    {member.name}
                  </h3>
                  <p className="text-gray-300 text-sm font-medium group-hover:text-white transition-colors duration-300">
                    {member.role}
                  </p>

                  {/* Accent line */}
                  <div className="mt-3 h-0.5 w-0 bg-gradient-to-r from-[#01ffdb] to-transparent group-hover:w-full transition-all duration-500"></div>
                </div>

                {/* Hover border effect */}
                <div className="absolute inset-0 rounded-2xl border border-[#01ffdb]/0 group-hover:border-[#01ffdb]/50 transition-all duration-500"></div>
              </div>
            </a>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default About;
