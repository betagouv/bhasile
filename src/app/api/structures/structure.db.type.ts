import { Prisma } from "@/generated/prisma/client";

export type StructureDbMap = Prisma.StructureGetPayload<{
  select: {
    id: true;
    latitude: true;
    longitude: true;
  };
}>;

export type StructureDbList = Prisma.StructureGetPayload<{
  include: {
    adresses: {
      include: {
        adresseTypologies: {
          orderBy: {
            year: "desc";
          };
        };
      };
    };
    cpomStructures: {
      include: {
        cpom: true;
      };
    };
    operateur: true;
    structureMillesimes: {
      orderBy: {
        year: "desc";
      };
    };
    structureTypologies: {
      orderBy: {
        year: "desc";
      };
    };
    forms: {
      include: {
        formDefinition: true;
      };
    };
    dnaStructures: {
      include: {
        dna: true;
      };
    };
  };
}>;

export type StructureDbDetails = Prisma.StructureGetPayload<{
  include: {
    userNotes: {
      orderBy: { createdAt: "desc" };
      select: { text: true };
    };
    dnaStructures: {
      include: {
        dna: {
          include: {
            activites: {
              orderBy: {
                date: "desc";
              };
            };
            evenementsIndesirablesGraves: {
              orderBy: {
                evenementDate: "desc";
              };
            };
          };
        };
      };
    };
    finesses: true;
    adresses: {
      include: {
        adresseTypologies: {
          orderBy: {
            year: "desc";
          };
        };
      };
    };
    antennes: true;
    contacts: true;
    structureTypologies: {
      orderBy: {
        year: "desc";
      };
    };
    structureMillesimes: {
      orderBy: {
        year: "desc";
      };
    };
    cpomStructures: {
      include: {
        cpom: {
          include: {
            structures: {
              include: {
                structure: {
                  select: {
                    id: true;
                    codeBhasile: true;
                    type: true;
                    communeAdministrative: true;
                    operateur: {
                      select: {
                        name: true;
                      };
                    };
                    forms: true;
                  };
                };
              };
            };
            operateur: true;
            actesAdministratifs: {
              include: {
                fileUploads: true;
              };
            };
            budgets: {
              orderBy: {
                year: "desc";
              };
            };
          };
        };
      };
    };
    evaluations: {
      include: {
        fileUploads: true;
      };
      orderBy: {
        date: "desc";
      };
    };
    controles: {
      include: {
        fileUploads: true;
      };
      orderBy: {
        date: "desc";
      };
    };
    actesAdministratifs: {
      include: {
        fileUploads: true;
      };
    };
    documentsFinanciers: {
      include: {
        fileUploads: true;
      };
    };
    budgets: {
      orderBy: {
        year: "desc";
      };
    };
    indicateursFinanciers: {
      orderBy: {
        year: "desc";
      };
    };
    operateur: true;
    forms: {
      include: {
        formDefinition: true;
        formSteps: {
          include: {
            stepDefinition: true;
          };
        };
      };
    };
  };
}>;

export type StructureDbOperateur = Prisma.StructureGetPayload<{
  select: {
    id: true;
    codeBhasile: true;
    forms: true;
  };
}>;
