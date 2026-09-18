from data_science.detector_runner import run_detector


class DetectorTester:
    def __init__(self, detector_name):
        self.detector_name = detector_name

    def run_test(self, dataframe, parameters=None):
        return run_detector(
            self.detector_name,
            dataframe,
            parameters
        )

    def test_case(self, name, dataframe, parameters=None):
        result = self.run_test(dataframe, parameters)

        return {
            "test_name": name,
            "detector": self.detector_name,
            "status": result.get("status"),
            "result": result
        }
