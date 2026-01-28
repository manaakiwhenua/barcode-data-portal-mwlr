#!/usr/bin/env bash

#
# Couchbase initialization script
#
# This script is run the first time that the database is started
# It creates:
# - a cluster
# - a user
# - the buckets
# - the collections
# - the test data
# - the indexes
#

# Enables job control
set -m

# Enables error propagation
set -e

# Check if argument is set to drop the existing CouchBase cluster is true
if [ "$1" = true ] || [ "$1" = "true" ] ; then
  echo "Clearing existing CouchBase cluster..."
  rm -r /opt/couchbase/var/*
fi


# Run the server and send it to the background
/entrypoint.sh couchbase-server &

# Check if couchbase server is up
check_db() {
  curl --silent http://127.0.0.1:8091/pools > /dev/null
  echo $?
}

# Variable used in echo
i=1
# Echo with
log() {
  echo "[$i] [$(date +"%T")] $@"
  i=`expr $i + 1`
}

# Wait until it's ready
until [[ $(check_db) = 0 ]]; do
  >&2 log "Waiting for Couchbase Server to be available ..."
  sleep 1
done

# Function to import JSONL data, stripping empty lines to prevent parse errors
# Usage: import_jsonl <bucket> <collection> <file> <key_pattern>
import_jsonl() {
  local bucket="$1"
  local collection="$2"
  local file="$3"
  local key_pattern="$4"
  
  log "Importing $file into $bucket.$collection..."
  
  # Create a temp file with empty lines removed
  local tmpfile=$(mktemp)
  grep -v '^\s*$' "$file" > "$tmpfile" || true
  
  cbimport json --cluster 127.0.0.1 -u Administrator -p password \
    --bucket "$bucket" --scope-collection-exp "_default.$collection" \
    --format lines --dataset "file://$tmpfile" --generate-key "$key_pattern"
  
  rm -f "$tmpfile"
}

# Check if the cluster is already initialized
log "$(date +"%T") Reading cluster ........."
if couchbase-cli server-list -c 127.0.0.1 --username Administrator --password password | grep -q ERROR; then
    # Setup index and memory quota
    log "$(date +"%T") Init cluster ........."
    couchbase-cli cluster-init -c 127.0.0.1 --cluster-username Administrator --cluster-password password \
    --cluster-name BPDP_DevCluster --cluster-ramsize 1024 --cluster-index-ramsize 1024 --services data,index,query \
    --index-storage-setting default

    # Create the buckets
    log "$(date +"%T") Create buckets ........."
    couchbase-cli bucket-create -c 127.0.0.1 --username Administrator --password password --bucket BCDM \
        --bucket-type couchbase --bucket-ramsize 512
    couchbase-cli bucket-create -c 127.0.0.1 --username Administrator --password password --bucket DERIVED \
        --bucket-type couchbase --bucket-ramsize 256
    couchbase-cli bucket-create -c 127.0.0.1 --username Administrator --password password --bucket ANCILLARY \
        --bucket-type couchbase --bucket-ramsize 128

    # Insert data into the buckets
    couchbase-cli collection-manage -c 127.0.0.1 -u Administrator -p password --bucket BCDM --create-collection _default.primary
    couchbase-cli collection-manage -c 127.0.0.1 -u Administrator -p password --bucket DERIVED --create-collection _default.accepted_terms
    couchbase-cli collection-manage -c 127.0.0.1 -u Administrator -p password --bucket DERIVED --create-collection _default.tax_geo_inst_summaries
    couchbase-cli collection-manage -c 127.0.0.1 -u Administrator -p password --bucket DERIVED --create-collection _default.country_summaries
    couchbase-cli collection-manage -c 127.0.0.1 -u Administrator -p password --bucket DERIVED --create-collection _default.institution_summaries
    couchbase-cli collection-manage -c 127.0.0.1 -u Administrator -p password --bucket DERIVED --create-collection _default.sequence_run_site_summaries
    couchbase-cli collection-manage -c 127.0.0.1 -u Administrator -p password --bucket DERIVED --create-collection _default.bin_summaries
    couchbase-cli collection-manage -c 127.0.0.1 -u Administrator -p password --bucket DERIVED --create-collection _default.dataset_summaries
    couchbase-cli collection-manage -c 127.0.0.1 -u Administrator -p password --bucket DERIVED --create-collection _default.primer_summaries
    couchbase-cli collection-manage -c 127.0.0.1 -u Administrator -p password --bucket DERIVED --create-collection _default.taxonomy_summaries
    couchbase-cli collection-manage -c 127.0.0.1 -u Administrator -p password --bucket ANCILLARY --create-collection _default.barcodeclusters
    couchbase-cli collection-manage -c 127.0.0.1 -u Administrator -p password --bucket ANCILLARY --create-collection _default.datasets
    couchbase-cli collection-manage -c 127.0.0.1 -u Administrator -p password --bucket ANCILLARY --create-collection _default.publications
    couchbase-cli collection-manage -c 127.0.0.1 -u Administrator -p password --bucket ANCILLARY --create-collection _default.countries
    couchbase-cli collection-manage -c 127.0.0.1 -u Administrator -p password --bucket ANCILLARY --create-collection _default.institutions
    couchbase-cli collection-manage -c 127.0.0.1 -u Administrator -p password --bucket ANCILLARY --create-collection _default.primers
    couchbase-cli collection-manage -c 127.0.0.1 -u Administrator -p password --bucket ANCILLARY --create-collection _default.taxonomies

    log "$(date +"%T") Inserting data into buckets ........."
    import_jsonl BCDM primary /db_data/BCDM.jsonl '%record_id%'
    import_jsonl DERIVED accepted_terms /db_data/accepted_terms.jsonl '%term%'
    import_jsonl DERIVED tax_geo_inst_summaries /db_data/tax_geo_inst_summaries.jsonl '%`tax_geo_inst_id`%'
    import_jsonl DERIVED country_summaries /db_data/country_summaries.jsonl '%`country/ocean`%'
    import_jsonl DERIVED institution_summaries /db_data/institution_summaries.jsonl '%`inst`%'
    import_jsonl DERIVED sequence_run_site_summaries /db_data/sequence_run_site_summaries.jsonl '%`sequence_run_site`%'
    import_jsonl DERIVED bin_summaries /db_data/bin_summaries.jsonl '%`bin_uri`%'
    import_jsonl DERIVED dataset_summaries /db_data/dataset_summaries.jsonl '%`dataset.code`%'
    import_jsonl DERIVED primer_summaries /db_data/primer_summaries.jsonl '%`name`%'
    import_jsonl DERIVED taxonomy_summaries /db_data/taxonomy_summaries.jsonl '%`taxid`%'
    import_jsonl ANCILLARY barcodeclusters /db_data/barcodeclusters.jsonl '%`barcodecluster.uri`%'
    import_jsonl ANCILLARY datasets /db_data/datasets.jsonl '%`dataset.code`%'
    import_jsonl ANCILLARY countries /db_data/geopols.jsonl '%`name`%'
    import_jsonl ANCILLARY institutions /db_data/institutions.jsonl '%name%'
    import_jsonl ANCILLARY primers /db_data/primers.jsonl '%`name`%'
    import_jsonl ANCILLARY taxonomies /db_data/taxonomies.jsonl '%`taxid`%'
#    import_jsonl ANCILLARY publications /db_data/publications.jsonl '%`publication.id`%'



    # Create user
    log "$(date +"%T") Create users ........."
    couchbase-cli user-manage -c 127.0.0.1:8091 -u Administrator -p password --set --rbac-username $COUCHBASE_USER --rbac-password $COUCHBASE_PASSWORD \
        --rbac-name "$COUCHBASE_USER" --roles admin --auth-domain local

    # Need to wait until query service is ready to process N1QL queries
    log "$(date +"%T") Waiting ........."
    sleep 20

    # Create indexes
    echo "$(date +"%T") Create indexes ........."
    cbq -u Administrator -p password -f /db_data/indexes.validation.n1ql
fi

# Restores the server to the foreground
fg 1
