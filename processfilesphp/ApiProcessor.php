<?php

/*
 * Copyright 2011-2022 Abierto Networks, LLC.
 * All rights reserved.
 */

class ApiProcessor extends abnet_ApiProcessor {

    /**
     * Dispatch call
     */
    public function processApiCall() {
        $do = $this->request->getParam('do');

        switch ($do) {
            case 'import-hr':
                $this->importHR();
                break;
            case 'import-fb':
                $this->importFB();
                break;
            case 'import-so':
                $this->importSO();
                break;
            case 'import-ftk':
                $this->importFTK();
                break;
            default:
                $appid = $this->request->getParam('app');
                $this->logger->info("App {$appid} processApiCall called with unknown param: {$do}");
        }

        exit();
    }

    /**
     * Called from cron on the first day of every month at 6:30 am.
     * Make sure the time below matches the time in crontab.
     *
     * http://SERVER_URL/api/call/app/APP_ID/do/import-hr
     */
    private function importHR() {
        $now = getdate();
        $this->logger->info('importHR called at ' . $now['hours'] . ':' . $now['minutes']);

        //if ($now['mday'] == 1 && $now['hours'] == 6 && $now['minutes'] == 30) {
            $this->logger->info('import HR data');
            $this->import('hr');
        //}
    }

    /**
     * Called from cron every day at 5:00 am.  Make sure the time below matches the time in crontab.
     *
     * http://SERVER_URL/api/call/app/APP_ID/do/import-fb
     */
    private function importFB() {
        $now = getdate();
        $this->logger->info('importFB called at ' . $now['hours'] . ':' . $now['minutes']);

        if ($now['hours'] == 5 && $now['minutes'] == 0) {
            $this->logger->info('import FB data');
            $this->import('fb');
        }
    }

    /**
     * Called from cron every day at 10:30 am.  Make sure the time below matches the time in crontab.
     *
     * http://SERVER_URL/api/call/app/APP_ID/do/import-so
     */
    private function importSO() {
        $now = getdate();
        $this->logger->info('importSO called at ' . $now['hours'] . ':' . $now['minutes']);

        if ($now['hours'] == 10 && $now['minutes'] == 30) {
            $this->logger->info('import SO data');
            $this->import('so');
        }
    }

    /**
     * Called from cron every day at 3:30 pm.  Make sure the time below matches the time in crontab.
     *
     * http://SERVER_URL/api/call/app/APP_ID/do/import-ftk
     */
    private function importFTK() {
        $now = getdate();
        $this->logger->info('importSO called at ' . $now['hours'] . ':' . $now['minutes']);

        if ($now['hours'] == 15 && $now['minutes'] == 30) {
            $this->logger->info('import FTK data');
            $this->import('ftk');
        }
    }

    /**
     * NOTE: The data files are put on the server, in a predefined directory, with the names
     * listed below.  The files are then copied to the app directory by scripts run by cron,
     * and they are parsed from there.  We may need to revisit this.
     *
     * @param type $what
     * @return type
     */
    private function import($what) {
        $appid = $this->request->getParam('app');
        $path = APPS_PATH . $appid . '/data';
        $data = array();
        $files = array(
            'data1' => $path . '/anniversaries.csv',
            'data2' => $path . '/birthdays.csv',
            'data3' => $path . '/store_data.csv',
            'data4' => $path . '/sheetz_ftk.csv',
            'data5' => $path . '/sheetz_so.csv',
        );

        switch ($what) {
            case 'hr':
                $devicesMapper = new Application_Model_DevicesMapper();

                foreach ($devicesMapper->getUniqueids($appid) as $uid) {
                    $data[$uid]['data1'] = array();
                    $data[$uid]['data2'] = array();
                }

                $this->parseCsvFile($files['data1'], $data, 'data1');
                $this->parseCsvFile($files['data2'], $data, 'data2');

                foreach ($data as $key => $value) {
                    if (empty($value['data1'])) {
                        $data[$key]['data1'][] = array('No anniversaries data submitted this month');
                    }
                    if (empty($value['data2'])) {
                        $data[$key]['data2'][] = array('No birthdays data submitted this month');
                    }
                }
                break;
            case 'fb':
                $this->parseCsvFile($files['data3'], $data, 'data3');
                break;
            case 'ftk':
                // used for extra page under My Store, normally SFTK
                $this->parseCsvFile($files['data4'], $data, 'data4');
                break;
            case 'so':
                // used for extra slide on the home page, normally SheetzFest
                $this->parseCsvFile($files['data5'], $data, 'data5');
                break;
            default:
                return;
        }

        $devicesMapper = new Application_Model_DevicesMapper();
        $contentMapper = new Application_Model_ContentMapper();

        foreach ($data as $key => $value) {
            // $key is the store number; also see devicesByName doc
            $devices = $devicesMapper->devicesByName($key);

            foreach ($devices as $device) {
                $content = new Application_Model_Content();
                $version = abnet_Util::versionIncrement($device->version, VERSION_RELEASE);

                $content->setId(null);
                $content->setUserid(1);
                $content->setAppid($appid);
                $content->setDisplayid($device->displayid);
                $content->setDeviceid($device->id);
                $content->setFavorite(0);
                $content->setTimestamp(date('Y-m-d H:i:s'));
                $content->setSchedule(date('Y-m-d H:i:s'));
                $content->setContentname('');
                $content->setVersion($version);
                $content->setMeta('items');
                $content->setData(json_encode(array('data' => $value)));
                $content->setDeleted(0);

                $contentMapper->write($content);
            }
        }
    }

    /**
     *
     * @param type $path
     * @param type $data
     * @param type $what
     */
    private function parseCsvFile($path, &$data, $what) {
        if (($handle = fopen($path, 'r')) !== false) {
            $this->logger->info('parsing file ' . $path);

            while (($row = fgetcsv($handle)) !== false) {
                $uid = array_shift($row);
                $data[$uid][$what][] = $row;
            }

            fclose($handle);
        }
        else {
            $this->logger->info('failed to open file ' . $path);
        }
    }

}
