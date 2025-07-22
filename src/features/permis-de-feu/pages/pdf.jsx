import React from 'react';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';

// Define styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    borderBottom: 2,
    borderBottomColor: '#000',
    marginBottom: 2,
  },
  headerLeft: {
    flex: 1,
    borderRight: 1,
    borderRightColor: '#000',
    padding: 5,
  },
  headerCenter: {
    flex: 2,
    borderRight: 1,
    borderRightColor: '#000',
    padding: 5,
    alignItems: 'center',
  },
  headerRight: {
    flex: 1,
    padding: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  sectionTitle: {
    backgroundColor: '#000',
    color: '#fff',
    padding: 5,
    fontSize: 11,
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    borderBottom: 1,
    borderBottomColor: '#000',
  },
  cell: {
    flex: 1,
    padding: 5,
    borderRight: 1,
    borderRightColor: '#000',
  },
  cellNoBorder: {
    flex: 1,
    padding: 5,
  },
  checkbox: {
    width: 12,
    height: 12,
    border: 1,
    borderColor: '#000',
    marginRight: 5,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 3,
  },
  label: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  subLabel: {
    fontSize: 8,
  },
  largeTextArea: {
    minHeight: 100,
    borderBottom: 1,
    borderBottomColor: '#000',
  },
});

// PDF Document Component - This should NOT be rendered directly in DOM
const PermisFeuPDFDocument = ({ permis }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text>SUEZ</Text>
          <Text style={styles.subLabel}>RECYCLAGE ET VALORISATION FRANCE</Text>
        </View>
        <View style={styles.headerCenter}>
          <Text style={styles.label}>UVE d'Argenteuil</Text>
          <Text style={styles.title}>PERMIS FEU</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.label}>DATE: ___________</Text>
          <Text style={styles.label}>N°: ___________</Text>
          <Text style={styles.label}>Ordre/permis de travaux</Text>
          <Text style={styles.label}>N°: ___________</Text>
        </View>
      </View>

      {/* Travail à effectuer */}
      <View>
        <Text style={styles.sectionTitle}>Travail à effectuer :</Text>
        <View style={styles.row}>
          <View style={[styles.cell, { flex: 2 }]}>
            <Text style={styles.label}>Lieux et opérations à effectuer :</Text>
            <View style={styles.largeTextArea}>
              <Text>{permis?.lieu?.name || ''}</Text>
              <Text>{permis?.operation_description || ''}</Text>
            </View>
          </View>
          <View style={styles.cellNoBorder}>
            <Text style={styles.label}>Personne responsable de la surveillance :</Text>
            <View style={styles.checkboxRow}>
              <View style={styles.checkbox}></View>
              <Text>EU*</Text>
            </View>
            <View style={styles.checkboxRow}>
              <View style={styles.checkbox}></View>
              <Text>E.E*</Text>
            </View>
            <Text style={[styles.label, { marginTop: 10 }]}>Travaux réalisés par :</Text>
            <Text>{permis?.responsable?.name || ''}</Text>
          </View>
        </View>
      </View>

      {/* Dangers et mesures spécifiques */}
      <View>
        <Text style={styles.sectionTitle}>I. Dangers et mesures spécifiques</Text>
        <View style={styles.row}>
          <View style={styles.cell}>
            <Text style={styles.label}>Source de chaleur - Travaux (Energie d'activation)</Text>
            <View style={styles.checkboxRow}>
              <View style={styles.checkbox}></View>
              <Text>Soudure électrique</Text>
            </View>
            <View style={styles.checkboxRow}>
              <View style={styles.checkbox}></View>
              <Text>Découpage électrique</Text>
            </View>
            <View style={styles.checkboxRow}>
              <View style={styles.checkbox}></View>
              <Text>Soudure au chalumeau</Text>
            </View>
            <View style={styles.checkboxRow}>
              <View style={styles.checkbox}></View>
              <Text>Découpage au chalumeau</Text>
            </View>
            <View style={styles.checkboxRow}>
              <View style={styles.checkbox}></View>
              <Text>Lampe à souder</Text>
            </View>
            <View style={styles.checkboxRow}>
              <View style={styles.checkbox}></View>
              <Text>Meulage</Text>
            </View>
            <View style={styles.checkboxRow}>
              <View style={styles.checkbox}></View>
              <Text>Autres (préciser) : ___________</Text>
            </View>
          </View>
          <View style={styles.cellNoBorder}>
            <Text style={styles.label}>Facteurs aggravants liés à l'environnement de travail</Text>
            <View style={styles.checkboxRow}>
              <View style={styles.checkbox}></View>
              <Text>Présence de matières combustibles : ...</Text>
            </View>
            <View style={styles.checkboxRow}>
              <View style={styles.checkbox}></View>
              <Text>Présence de poussières</Text>
            </View>
            <View style={styles.checkboxRow}>
              <View style={styles.checkbox}></View>
              <Text>Présence de chemin(s) de câbles</Text>
            </View>
            <View style={styles.checkboxRow}>
              <View style={styles.checkbox}></View>
              <Text>Présence convoyeurs</Text>
            </View>
            <View style={styles.checkboxRow}>
              <View style={styles.checkbox}></View>
              <Text>Présence d'une co-activité</Text>
            </View>
            <View style={styles.checkboxRow}>
              <View style={styles.checkbox}></View>
              <Text>Autres (préciser) : ...</Text>
            </View>
          </View>
        </View>
      </View>

    </Page>
  </Document>
);

// Component to use in your app
const PermisFeuPDFGenerator = ({ permis }) => {
  return (
    <PDFDownloadLink
      document={<PermisFeuPDFDocument permis={permis} />}
      fileName={`permis-feu-${permis?.id || 'document'}.pdf`}
      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-500"
    >
      {({ blob, url, loading, error }) =>
        loading ? 'Génération du PDF...' : 'Télécharger PDF'
      }
    </PDFDownloadLink>
  );
};

export default PermisFeuPDFGenerator;