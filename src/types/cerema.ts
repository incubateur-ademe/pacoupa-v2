export interface CeremaFeatureAttributes {
  libelle_adresse: string;
  annee_construction?: number;
  nb_logement?: number;
  surf_res_ind?: number;
  surf_res_col?: number;
  surf_ter?: number;
  besoin_res_ind_ch?: number;
  besoin_res_col_ch?: number;
  besoin_ter_ch?: number;
  besoin_res_ind_ecs?: number;
  besoin_res_col_ecs?: number;
  besoin_ter_ecs?: number;
  type_installation_chauffage?: string;
  type_energie_chauffage?: string;
  type_generateur_chauffage?: string;
  type_installation_ecs?: string;
  type_energie_ecs?: string;
  distance_reseau_c?: string;
  reseau_zp?: number;
  reseau_zfp?: number;
  reseau_pdp?: number;
  /* protection patrimoniale */
  ac1?: number; // monument historique
  ac4?: number; // site patrimonial remarquable
  /* protection environnementale */
  ac2?: number; // site inscrit ou classé
  ac3?: number; // réserve naturelle
  liste_ppa?: string;
  gmi_nappe_200?: number;
  gmi_sondes_200?: number;
  pot_nappe_text?: string;
  couv_sondes_200?: number;
  prod_st_mwh_an?: number;
  couv_st_ecs?: number;
  classe_dpe?: string;
  [key: string]: any;
}

export interface CeremaApiResponse {
  features: CeremaFeatureAttributes[];
  [key: string]: any;
}
